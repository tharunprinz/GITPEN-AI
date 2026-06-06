import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ChatSessionSchema = new mongoose.Schema(
  {
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true, index: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);
export default ChatSession;
