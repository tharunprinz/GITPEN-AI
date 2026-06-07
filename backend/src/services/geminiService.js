import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq Client as a fallback for Gemini
let groq = null;
if (GROQ_API_KEY) {
  groq = new Groq({ apiKey: GROQ_API_KEY });
}

/**
 * Perform security scanning on files using Groq API (fallback from Gemini).
 * Uses structured JSON outputs for reliable schema parsing.
 */
export const runSecurityScan = async (repoName, filesContent) => {
  if (!GROQ_API_KEY || !groq) {
    console.warn('API_KEY not configured. Simulating fallback data...');
    return getSimulatedScanData(repoName);
  }

  // Format code files context
  let context = '';
  for (const file of filesContent) {
    context += `\n--- FILE: ${file.path} ---\n${file.content}\n`;
  }

  const systemPrompt = `
    You are an advanced application security scanner and analyst. Analyze the provided source code files from the repository "${repoName}".
    
    Tasks to perform:
    1. Identify all security vulnerabilities and risks (e.g., hardcoded credentials, SQL injection, XSS, insecure dependencies, bad cryptographic practices, path traversal).
    2. Determine vulnerability severity (critical, high, medium, low).
    3. Specify the exact file path and line numbers (lineStart, lineEnd) where they occur.
    4. Provide actionable mitigation/recommendation steps.
    5. Perform Configuration Hardening Analysis: look for container, environment, deployment, or dev configuration files (e.g., package.json, Dockerfile, docker-compose.yml, tsconfig.json, .env.example) and assess their security settings.
    6. Perform Dependency Health check: inspect package files to identify outdated or vulnerable dependencies.
    7. Generate a comprehensive repository security score (0-100), where 100 is perfectly secure and 0 is extremely vulnerable.
    8. Write a clear overall summary of the security status.
    
    You MUST output your response strictly as a JSON object that matches the following schema. Do NOT include any markdown formatting, backticks, or explanatory text outside of the JSON object.
    {
      "securityScore": 82,
      "summary": "Overall security assessment summary...",
      "vulnerabilities": [
        {
          "id": "vuln-01",
          "title": "Hardcoded AWS Access Key",
          "description": "An AWS Access Key ID was found in config.js. This exposes AWS resources.",
          "severity": "critical",
          "file": "config.js",
          "lineStart": 12,
          "lineEnd": 12,
          "codeSnippet": "const AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';",
          "recommendation": "Use environment variables or AWS Secrets Manager to inject credentials at runtime."
        }
      ],
      "dependencyHealth": {
        "status": "healthy",
        "vulnerabilitiesCount": 1,
        "outdatedDependencies": [
          {
            "name": "axios",
            "currentVersion": "0.21.1",
            "latestVersion": "1.7.2",
            "severity": "medium"
          }
        ]
      },
      "configHardening": [
        {
          "setting": "Environment Variables",
          "status": "warning",
          "description": ".env.example contains sensitive keys in comments",
          "recommendation": "Remove any sensitive comment references from template env files."
        },
        {
          "setting": "Docker Non-Root User",
          "status": "failed",
          "description": "Dockerfile runs commands as root user",
          "recommendation": "Add a dedicated user and switch to it using 'USER node' or similar."
        }
      ]
    }
  `;

  const userPrompt = `
    Analyze the following source code files and provide the JSON output:
    
    Source Code Files Context:
    ${context}
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const text = chatCompletion.choices[0].message.content;
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error) {
    console.error('Error running Groq security scan:', error);
    throw new Error(`Security analysis failed: ${error.message}`);
  }
};

/**
 * Fallback simulation data for testing if no API key is specified
 */
const getSimulatedScanData = (repoName) => {
  return {
    securityScore: 68,
    summary: `GITPEN AI completed a mock scanning run for "${repoName}". Setup your API_KEY in the .env file to enable live deep scans.`,
    vulnerabilities: [
      {
        id: "sim-vuln-01",
        title: "Hardcoded API Token",
        description: "A hardcoded Slack OAuth token was found in the source code. Storing credentials in plain text poses high security risks.",
        severity: "critical",
        file: "src/config/db.js",
        lineStart: 5,
        lineEnd: 5,
        codeSnippet: "const SLACK_HOOK = 'https://example-hooks.slack.com/services/T000/B000/XXXXX';",
        recommendation: "Use environment variables to inject connection hooks or api tokens."
      },
      {
        id: "sim-vuln-02",
        title: "Insecure JWT Signing",
        description: "JWT is signed using a weak or static secret string. This allows token spoofing and identity validation bypass.",
        severity: "high",
        file: "src/server.js",
        lineStart: 25,
        lineEnd: 27,
        codeSnippet: "jwt.sign({ id: user._id }, 'supersecret', { expiresIn: '1d' });",
        recommendation: "Store JWT signing secret securely in environment variables and use a strong cryptographically generated key."
      },
      {
        id: "sim-vuln-03",
        title: "Cross-Origin Policy Wildcard Allowed",
        description: "CORS configuration is set to allow any origin (*). This could permit unauthorized domains to read responses from this server.",
        severity: "medium",
        file: "src/server.js",
        lineStart: 18,
        lineEnd: 18,
        codeSnippet: "app.use(cors({ origin: '*' }));",
        recommendation: "Configure explicit whitelisted origins rather than using wildcard access control."
      }
    ],
    dependencyHealth: {
      status: "warning",
      vulnerabilitiesCount: 2,
      outdatedDependencies: [
        {
          name: "express",
          currentVersion: "4.17.1",
          latestVersion: "4.19.2",
          severity: "low"
        },
        {
          name: "mongoose",
          currentVersion: "5.11.9",
          latestVersion: "8.4.1",
          severity: "high"
        }
      ]
    },
    configHardening: [
      {
        setting: "Environment Variables Configuration",
        status: "failed",
        description: "Development API keys and configuration secrets are exposed in code files instead of being stored in system environment.",
        recommendation: "Introduce dotenv package to read keys exclusively from process.env."
      },
      {
        setting: "TLS/HTTPS Configuration",
        status: "warning",
        description: "Local development server doesn't enforce SSL/TLS encryption standard headers.",
        recommendation: "Implement helmet middleware and configure redirect loops to enforce SSL in production deployments."
      }
    ]
  };
};
