import { Scan } from '../models/Scan.js';
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
 * Triggers repository scanning
 * POST /api/scan
 * Body: { repoUrl: "https://github.com/..." }
 */
export const scanRepository = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: 'Repository URL is required' });
  }

  try {
    // 1. Parse URL
    const { owner, repo, branch } = parseGitHubUrl(repoUrl);

    // 2. Fetch Latest Commit Hash (used as cache key)
    const commitInfo = await getLatestCommitHash(owner, repo, branch);
    const resolvedHash = typeof commitInfo === 'object' ? commitInfo.hash : commitInfo;
    const resolvedBranch = typeof commitInfo === 'object' ? commitInfo.branch : branch;

    // 3. Check MongoDB Cache (Scanned in last 24h)
    const cachedScan = await Scan.findOne({
      owner,
      name: repo,
      commitHash: resolvedHash,
    });

    if (cachedScan) {
      console.log(`[Cache Hit] Returning cached scan for ${owner}/${repo} @ ${resolvedHash}`);
      return res.status(200).json({
        cached: true,
        data: cachedScan,
      });
    }

    console.log(`[Cache Miss] Starting scanning flow for ${owner}/${repo} @ ${resolvedHash}`);

    // 4. Retrieve Directory Tree
    const tree = await getRepositoryTree(owner, repo, resolvedHash);
    
    // 5. Select Critical Files to analyze (limit context window bloat)
    const selectedFiles = selectCriticalFiles(tree, 15);
    
    if (selectedFiles.length === 0) {
      return res.status(400).json({
        error: 'No supportable source code files found in this repository to analyze.',
      });
    }

    // 6. Download contents in parallel
    const filesWithContent = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          const content = await getFileContent(owner, repo, file.sha);
          return {
            path: file.path,
            sha: file.sha,
            size: file.size,
            content,
          };
        } catch (err) {
          console.error(`Failed to load content for ${file.path}:`, err.message);
          return null;
        }
      })
    );

    const validFiles = filesWithContent.filter(Boolean);

    // 7. Perform AI Analyses (parallelized)
    const [securityScan, qualityScan] = await Promise.all([
      runSecurityScan(`${owner}/${repo}`, validFiles),
      runCodeQualityScan(`${owner}/${repo}`, validFiles),
    ]);

    // 8. Assemble Full Scan Document
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

    // Save to Cache
    await scanDoc.save();

    return res.status(201).json({
      cached: false,
      data: scanDoc,
    });
  } catch (error) {
    console.error('Scan pipeline error:', error);
    return res.status(500).json({
      error: 'An error occurred during repository analysis.',
      details: error.message,
    });
  }
};

/**
 * Returns latest scanning history list
 * GET /api/scan/history
 */
export const getScanHistory = async (req, res) => {
  try {
    // Get latest 10 scans
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

    // Try fetching file content directly via GitHub API
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
