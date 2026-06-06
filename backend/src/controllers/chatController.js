import { ChatSession } from '../models/ChatSession.js';
import { Scan } from '../models/Scan.js';
import { queryOpenRouter } from '../services/openRouterService.js';

/**
 * Sends a message to the AI chatbot with repository context
 * POST /api/chat/:scanId
 */
export const handleChatMessage = async (req, res) => {
  const { scanId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // 1. Fetch scan context
    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan context not found' });
    }

    // 2. Fetch or create Chat Session
    let chatSession = await ChatSession.findOne({ scanId });
    if (!chatSession) {
      chatSession = new ChatSession({ scanId, messages: [] });
    }

    // 3. Keep history constraint (last 10 messages) to avoid token context bloat
    const contextHistory = chatSession.messages.slice(-10);

    // 4. Query OpenRouter
    const aiResponse = await queryOpenRouter(scan, contextHistory, message);

    // 5. Save user message and AI response to MongoDB
    chatSession.messages.push({ role: 'user', content: message });
    chatSession.messages.push({ role: 'assistant', content: aiResponse });
    await chatSession.save();

    return res.status(200).json({
      reply: aiResponse,
      session: chatSession,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Failed to process chat response',
      details: error.message,
    });
  }
};

/**
 * Retrieve chat logs for a repository scan
 * GET /api/chat/:scanId
 */
export const getChatSession = async (req, res) => {
  const { scanId } = req.params;
  try {
    const chatSession = await ChatSession.findOne({ scanId });
    if (!chatSession) {
      // Return empty session
      return res.status(200).json({ messages: [] });
    }
    return res.status(200).json(chatSession);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch chat logs' });
  }
};
