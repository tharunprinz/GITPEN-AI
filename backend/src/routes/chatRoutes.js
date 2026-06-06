import express from 'express';
import { handleChatMessage, getChatSession } from '../controllers/chatController.js';

const router = express.Router();

router.post('/:scanId', handleChatMessage);
router.get('/:scanId', getChatSession);

export default router;
