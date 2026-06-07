import { Scan } from '../models/Scan.js';
import { ScanJob } from '../models/ScanJob.js';
import {
  parseGitHubUrl,
  getLatestCommitHash,
  getRepositoryTree,
  selectCriticalFiles,
  getFileContent
} from '../services/githubService.js';
import { runSecurityScan } from '../services/geminiService.js';
import { runCodeQualityScan } from '../services/groqService.js';

/**
 * Background worker that performs the actual repository scan.
 * Runs fire-and-forget — never awaited by the HTTP handler.
 * Updates the ScanJob document as it progresses.
 */
const runScanInBackground = async (job, repoUrl) => {
  try {
    // Mark as running
    await ScanJob.findByIdAndUpdate(job._id, { status: 'running', phase: 'Fetching repository info...' });

    const { owner, repo, branch } = parseGitHubUrl(repoUrl);

    // Check commit hash
    await ScanJob.findByIdAndUpdate(job._id, { phase: 'Checking latest commit...' });
    const commitInfo = await getLatestCommitHash(owner, repo, branch);
    const resolvedHash = typeof commitInfo === 'object' ? commitInfo.hash : commitInfo;
    const resolvedBranch = typeof commitInfo === 'object' ? commitInfo.branch : branch;

    // Check MongoDB cache first
    const cachedScan = await Scan.findOne({ owner, name: repo, commitHash: resolvedHash });
    if (cachedScan) {
      console.log(`[Cache Hit] Returning cached scan for ${owner}/${repo} @ ${resolvedHash}`);
      await ScanJob.findByIdAndUpdate(job._id, {
        status: 'completed',
        phase: 'Done',
        scanId: cachedScan._id,
      });
      return;
    }

    console.log(`[Cache Miss] Starting scanning flow for ${owner}/${repo} @ ${resolvedHash}`);

    // Fetch repository tree
    await ScanJob.findByIdAndUpdate(job._id, { phase: 'Selecting critical files...' });
    const tree = await getRepositoryTree(owner, repo, resolvedHash);
    const selectedFiles = selectCriticalFiles(tree, 15);

    if (selectedFiles.length === 0) {
      await ScanJob.findByIdAndUpdate(job._id, {
        status: 'failed',
        phase: 'No source files found',
        error: 'No supportable source code files found in this repository.',
      });
      return;
    }

    // Download file contents in parallel
    await ScanJob.findByIdAndUpdate(job._id, { phase: 'Downloading file contents...' });
    const filesWithContent = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          const content = await getFileContent(owner, repo, file.sha);
          return { path: file.path, sha: file.sha, size: file.size, content };
        } catch (err) {
          console.error(`Failed to load content for ${file.path}:`, err.message);
          return null;
        }
      })
    );
    const validFiles = filesWithContent.filter(Boolean);

    // Run AI analyses in parallel
    await ScanJob.findByIdAndUpdate(job._id, { phase: 'Running AI security analysis...' });
    const [securityScan, qualityScan] = await Promise.all([
      runSecurityScan(`${owner}/${repo}`, validFiles),
      runCodeQualityScan(`${owner}/${repo}`, validFiles),
    ]);

    // Assemble and save Scan document
    await ScanJob.findByIdAndUpdate(job._id, { phase: 'Saving results...' });
    const scanDoc = new Scan({
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner,
      name: repo,
      branch: resolvedBranch,
      commitHash: resolvedHash,
      securityScore: securityScan.securityScore || 50,
      summary: securityScan.summary || 'Scan completed successfully.',
      vulnerabilities: securityScan.vulnerabilities || [],
      codeQuality: {
        score: qualityScan.score || 50,
        readability: qualityScan.readability || '',
        complexity: qualityScan.complexity || '',
        suggestions: qualityScan.suggestions || [],
      },
      dependencyHealth: securityScan.dependencyHealth || {
        status: 'healthy',
        vulnerabilitiesCount: 0,
        outdatedDependencies: [],
      },
      configHardening: securityScan.configHardening || [],
      analyzedFiles: validFiles.map((f) => ({
        path: f.path,
        size: f.size,
        type: f.path.split('.').pop(),
      })),
    });

    await scanDoc.save();

    // Mark job as completed with reference to the scan
    await ScanJob.findByIdAndUpdate(job._id, {
      status: 'completed',
      phase: 'Done',
      scanId: scanDoc._id,
    });

    console.log(`[Scan Complete] ${owner}/${repo} — score: ${scanDoc.securityScore}`);
  } catch (error) {
    console.error('[Background Scan Error]', error.message);
    await ScanJob.findByIdAndUpdate(job._id, {
      status: 'failed',
      phase: 'Analysis failed',
      error: error.message,
    }).catch(() => {}); // Swallow update error
  }
};

/**
 * POST /api/scan
 * Creates a scan job, fires background scan, returns jobId immediately.
 * Response time: < 500ms — safe for Render free tier.
 */
export const scanRepository = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  if (!repoUrl.includes('github.com')) {
    return res.status(400).json({ error: 'Only GitHub repository URLs are supported.' });
  }

  try {
    // Create a pending job record
    const job = await ScanJob.create({ repoUrl });

    // Fire the scan in the background — do NOT await
    runScanInBackground(job, repoUrl).catch((err) => {
      console.error('[Unhandled background scan error]', err.message);
    });

    // Return the jobId immediately (within Render's 30s limit)
    return res.status(202).json({
      jobId: job._id,
      status: 'pending',
      phase: 'Queued',
      message: 'Scan started. Poll /api/scan/status/:jobId for results.',
    });
  } catch (error) {
    console.error('Error creating scan job:', error);
    return res.status(500).json({ error: 'Failed to start scan job.', details: error.message });
  }
};

/**
 * GET /api/scan/status/:jobId
 * Polls the scan job status. Returns scanId when completed.
 * Frontend calls this every 3 seconds until status = "completed".
 */
export const getScanStatus = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await ScanJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Scan job not found.' });
    }

    const response = {
      jobId: job._id,
      status: job.status,
      phase: job.phase,
      createdAt: job.createdAt,
    };

    if (job.status === 'completed' && job.scanId) {
      response.scanId = job.scanId;
    }

    if (job.status === 'failed') {
      response.error = job.error;
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get scan status.' });
  }
};

/**
 * Returns latest scanning history list
 * GET /api/scan/history
 */
export const getScanHistory = async (req, res) => {
  try {
    const history = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('repoUrl owner name branch securityScore vulnerabilities createdAt');

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve scan history' });
  }
};

/**
 * Fetch scan details by Scan ID
 * GET /api/scan/:id
 */
export const getScanDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const scan = await Scan.findById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan results not found' });
    }
    return res.status(200).json(scan);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch scan details' });
  }
};

/**
 * Fetch a file's content dynamically for the code viewer
 * GET /api/scan/:id/file?path=src/db.js
 */
export const getScanFileContent = async (req, res) => {
  const { id } = req.params;
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'File path parameter is required' });
  }

  try {
    const scan = await Scan.findById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan record not found' });
    }

    const tree = await getRepositoryTree(scan.owner, scan.name, scan.commitHash);
    const fileNode = tree.find((node) => node.path === path);

    if (!fileNode) {
      return res.status(404).json({ error: 'File path not found in repository tree' });
    }

    const content = await getFileContent(scan.owner, scan.name, fileNode.sha);
    return res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching file content:', error);
    return res.status(500).json({ error: 'Failed to retrieve file contents from GitHub' });
  }
};
