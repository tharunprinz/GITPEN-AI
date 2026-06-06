import { parseGitHubUrl, getLatestCommitHash, selectCriticalFiles } from '../src/services/githubService.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function runTests() {
  console.log('--- GITPEN Validation Script ---');

  // Test 1: GitHub URL Parsing
  console.log('\n[Test 1] Parsing GitHub URL...');
  try {
    const urls = [
      'https://github.com/expressjs/express',
      'https://github.com/facebook/react/tree/main',
      'git@github.com:node/node.git'
    ];
    for (const url of urls) {
      const parsed = parseGitHubUrl(url);
      console.log(`URL: ${url} => Owner: ${parsed.owner}, Repo: ${parsed.repo}, Branch: ${parsed.branch}`);
    }
    console.log('✅ URL Parsing Success!');
  } catch (error) {
    console.error('❌ URL Parsing Failed:', error.message);
  }

  // Test 2: Fetching Commits and Tree filtering (Public repository)
  console.log('\n[Test 2] Querying GitHub API (expressjs/express)...');
  try {
    const owner = 'expressjs';
    const repo = 'express';
    const sha = await getLatestCommitHash(owner, repo, 'master');
    console.log(`Latest commit hash on master: ${sha}`);
    
    // Simulate some file nodes for filtering test
    const mockTree = [
      { path: 'package.json', type: 'blob', size: 1200 },
      { path: 'src/db.js', type: 'blob', size: 850 },
      { path: 'node_modules/express/index.js', type: 'blob', size: 10450 },
      { path: 'README.md', type: 'blob', size: 4500 },
      { path: 'Dockerfile', type: 'blob', size: 600 },
      { path: 'src/controllers/user.js', type: 'blob', size: 1800 },
      { path: 'src/tests/user.test.js', type: 'blob', size: 1200 }
    ];

    const selected = selectCriticalFiles(mockTree, 5);
    console.log('Selected critical files:');
    selected.forEach(file => {
      console.log(`- ${file.path} (score: ${file.score})`);
    });
    console.log('✅ GitHub services verified successfully!');
  } catch (error) {
    console.error('❌ GitHub services failed:', error.message);
    console.log('(Note: This is normal if you are offline or hit rate limits without a GITHUB_TOKEN)');
  }

  console.log('\n--- Validation Finished ---');
}

runTests();
