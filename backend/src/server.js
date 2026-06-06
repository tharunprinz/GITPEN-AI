import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import scanRoutes from './routes/scanRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // For development accessibility; restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes API Mapping
app.use('/api/scan', scanRoutes);
app.use('/api/chat', chatRoutes);

// Base Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`GITPEN AI Server running on port ${PORT}`);
});
