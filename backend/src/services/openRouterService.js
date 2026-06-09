import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const CHAT_MODEL = process.env.CHAT_MODEL || 'meta-llama/llama-3.1-70b-instruct';

/**
 * Sends messages to OpenRouter with security scan context to get a smart response.
 */
export const queryOpenRouter = async (scanData, chatHistory, userMessage) => {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY not configured. Simulating fallback chatbot responses...');
    return getSimulatedChatResponse(scanData, userMessage);
  }

  // Build system prompt detailing the codebase scan
  const systemPrompt = `
    You are GITPEN AI, an expert cybersecurity assistant and AI code reviewer.
    You have scanned the repository "${scanData.owner}/${scanData.name}".
    Here is the summary of findings:
    - Overall Security Score: ${scanData.securityScore}/100
    - Code Quality Score: ${scanData.codeQuality.score}/100
    - Total Vulnerabilities found: ${scanData.vulnerabilities.length}
    
    Detected Vulnerabilities details:
    ${JSON.stringify(scanData.vulnerabilities.map(v => ({
      title: v.title,
      severity: v.severity,
      file: v.file,
      lines: `${v.lineStart}-${v.lineEnd}`,
      code: v.codeSnippet,
      remedy: v.recommendation
    })), null, 2)}

    Configuration Hardening Findings:
    ${JSON.stringify(scanData.configHardening, null, 2)}

    Dependency Health status: ${scanData.dependencyHealth.status} with ${scanData.dependencyHealth.vulnerabilitiesCount} issues.

    Guidelines:
    1. Respond to user queries about the code, vulnerabilities, or how to secure their repository.
    2. Provide accurate, clean, and secure code snippets.
    3. Keep answers precise, informative, and professional.
    4. If the user refers to files or bugs, look up the scan data provided above.
  `;

  // Format messages for OpenRouter
  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: CHAT_MODEL,
        messages: messages,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://github.com/GITPEN',
          'X-Title': 'GITPEN AI Security Assistant',
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying OpenRouter:', error.response?.data || error.message);
    throw new Error(`OpenRouter query failed: ${error.message}`);
  }
};

/**
 * Fallback static responses based on keywords in user message
 */
const getSimulatedChatResponse = (scanData, userMessage) => {
  const query = userMessage.toLowerCase();
  
  if (query.includes('score') || query.includes('rating') || query.includes('status')) {
    return `The security score of **${scanData.name}** is **${scanData.securityScore}/100**. We identified **${scanData.vulnerabilities.length}** issues that should be addressed to increase the score. The main risk areas are dependency health and configuration hardening settings.`;
  }
  
  if (query.includes('fix') || query.includes('mitigate') || query.includes('remediate')) {
    if (scanData.vulnerabilities.length > 0) {
      const first = scanData.vulnerabilities[0];
      return `To fix **${first.title}** in \`${first.file}\` (lines ${first.lineStart}-${first.lineEnd}):
      
1. Open the file and locate:
\`\`\`javascript
${first.codeSnippet || '// code snippet'}
\`\`\`
2. Apply the recommendation:
> ${first.recommendation}

Let me know if you want detailed fix guidelines for other vulnerabilities!`;
    }
    return "No outstanding high-severity vulnerabilities were identified. You can review dependencies in your configurations to ensure libraries stay updated.";
  }

  if (query.includes('vulnerabilit') || query.includes('bug') || query.includes('critical')) {
    if (scanData.vulnerabilities.length > 0) {
      const list = scanData.vulnerabilities.map(v => `- **[${v.severity.toUpperCase()}]** ${v.title} in \`${v.file}\``).join('\n');
      return `Here are the vulnerabilities detected in **${scanData.name}**:\n\n${list}\n\nAsk me about any specific issue to see how to remediate it.`;
    }
    return "We couldn't detect any high-severity vulnerability markers in the scanned files. Ensure your configuration files don't expose keys.";
  }

  return `Hello! I'm your GITPEN AI assistant. I have reviewed **${scanData.name}** and can help explain any of the security findings or provide safe refactoring examples.
  
Here are things you can ask me:
- *"How do I fix the vulnerability in ${scanData.vulnerabilities[0]?.file || 'db.js'}?"*
- *"Summarize the security risks of this repository."*
- *"How can I improve the configuration hardening score?"*`;
};
