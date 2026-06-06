import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Helper headers
const getHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `token ${GITHUB_TOKEN}`;
  }
  return headers;
};

/**
 * Parses a GitHub URL into owner, repo, branch, path
 * Handles formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - git@github.com:owner/repo.git
 */
export const parseGitHubUrl = (url) => {
  let cleaned = url.trim().replace(/\/$/, '');
  if (cleaned.endsWith('.git')) {
    cleaned = cleaned.substring(0, cleaned.length - 4);
  }

  let owner = '';
  let repo = '';
  let branch = 'main';

  if (cleaned.includes('git@github.com:')) {
    const parts = cleaned.split('git@github.com:')[1].split('/');
    owner = parts[0];
    repo = parts[1];
  } else if (cleaned.includes('github.com/')) {
    const parts = cleaned.split('github.com/')[1].split('/');
    owner = parts[0];
    repo = parts[1];
    if (parts[2] === 'tree' && parts[3]) {
      branch = parts[3];
    }
  } else {
    // Treat string as "owner/repo"
    const parts = cleaned.split('/');
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1];
    } else {
      throw new Error('Invalid GitHub URL format');
    }
  }

  return { owner, repo, branch };
};

/**
 * Gets the latest commit hash for the target branch
 */
export const getLatestCommitHash = async (owner, repo, branch = 'main') => {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data.sha;
  } catch (error) {
    // If main fails, check master
    if (branch === 'main') {
      try {
        const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/commits/master`;
        const response = await axios.get(fallbackUrl, { headers: getHeaders() });
        return { hash: response.data.sha, branch: 'master' };
      } catch (fallbackError) {
        throw new Error(`Failed to fetch commits: ${error.message}`);
      }
    }
    throw new Error(`Failed to fetch commits: ${error.message}`);
  }
};

/**
 * Recursively gets the file tree of a GitHub repository
 */
export const getRepositoryTree = async (owner, repo, sha) => {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data.tree || [];
  } catch (error) {
    throw new Error(`Failed to fetch repository tree: ${error.message}`);
  }
};

/**
 * Scoring system to prioritize files for analysis.
 * We want to look at configuration files, lockfiles, and backend/frontend logic files.
 * We want to skip testing files, build outputs, images, and binary artifacts.
 */
export const selectCriticalFiles = (tree, maxFiles = 15) => {
  const excludedPatterns = [
    /node_modules\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /\.git\//,
    /coverage\//,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|eot|ttf|mp4|webm|zip|tar|gz|pdf)$/i,
  ];

  const criticalScoring = [
    // High priority: package files & configs
    { regex: /(package\.json|requirements\.txt|Gemfile|go\.mod|Cargo\.toml|composer\.json)$/i, score: 100 },
    { regex: /(\.env\.example|\.env|docker-compose\.yml|Dockerfile)$/i, score: 95 },
    { regex: /(\.eslintrc|\.babelrc|tsconfig\.json|webpack\.config\.js|vite\.config\.ts|vite\.config\.js)$/i, score: 90 },
    { regex: /(kubernetes\/|k8s\/|\.github\/workflows\/)/i, score: 85 },
    // Main server/app logic
    { regex: /(server|app|index|main)\.(js|ts|py|go|rs|php|rb)$/i, score: 80 },
    // DB or security files
    { regex: /(db|database|auth|security|protect|middleware|config|connection)\.(js|ts|py|go)$/i, score: 75 },
    // Source directories
    { regex: /^src\/controllers\//i, score: 70 },
    { regex: /^src\/routes\//i, score: 70 },
    { regex: /^src\/middleware\//i, score: 70 },
    { regex: /^src\/services\//i, score: 65 },
    { regex: /^src\/models\//i, score: 65 },
    // General source code files
    { regex: /\.(js|ts|py|go|java|cpp|c|cs|php|rb|swift|rs|sh|yml|yaml)$/i, score: 50 },
  ];

  const scoredFiles = tree
    .filter((node) => node.type === 'blob') // Only files
    .filter((node) => !excludedPatterns.some((pattern) => pattern.test(node.path))) // Exclude files based on patterns
    .map((node) => {
      let score = 10; // Base score
      for (const rule of criticalScoring) {
        if (rule.regex.test(node.path)) {
          score = Math.max(score, rule.score);
        }
      }
      // Deduct points for test files, we scan security of production code primarily
      if (/(test|spec|\.mock)\./i.test(node.path)) {
        score -= 40;
      }
      return { ...node, score };
    });

  // Sort by score descending and return the top files
  return scoredFiles.sort((a, b) => b.score - a.score).slice(0, maxFiles);
};

/**
 * Downloads raw file content from GitHub
 */
export const getFileContent = async (owner, repo, sha) => {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;
    const response = await axios.get(url, { headers: getHeaders() });
    const content = response.data.content;
    const encoding = response.data.encoding;

    if (encoding === 'base64') {
      return Buffer.from(content, 'base64').toString('utf8');
    }
    return content;
  } catch (error) {
    throw new Error(`Failed to download blob ${sha}: ${error.message}`);
  }
};
