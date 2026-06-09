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
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  // Allow any Vercel deployment (preview + production)
  /\.vercel\.app$/,
  // Add your custom domain here if you have one:
  // 'https://yourdomain.com',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


// Increase server-level timeout to 120s for long-running LLM scan requests
app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    console.error(`[Timeout] Request ${req.method} ${req.path} timed out after 120s`);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out. The analysis is taking longer than expected. Please try again.' });
    }
  });
  next();
});

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
