# GITPEN AI

<div align="center">

![GITPEN AI Banner](https://img.shields.io/badge/GITPEN-AI-8b5cf6?style=for-the-badge&logo=github&logoColor=white)

**An AI-powered repository analyzer and architectural assistant.**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%20API-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-API-FF6B6B?style=flat-square)](https://openrouter.ai/)

</div>

---

##  Overview

GITPEN AI is a full-stack application that analyzes GitHub repositories to provide architectural insights, code health scores, and actionable improvements. It leverages **Google Gemini** for structural analysis and **OpenRouter** to enable natural language chatting with repository context.

The application fetches repository metadata, file structures, and commit history, then processes this data through AI models to generate summaries, risk assessments, and contributor statistics. Results are cached in MongoDB to optimize performance and reduce API costs.

---

##  Features

-  **Repository Analysis**: Automated extraction of tech stack, file structure, and commit history
-  **🤖 Deep Code Analysis (NEW)**: Groq AI analyzes actual source code files for quality, security, and performance
-  **Code Health Scoring**: Algorithmic scoring (0-100) based on maintainability, structure, and code quality
-  **AI Chatbot**: Context-aware chat interface powered by OpenRouter (Claude, GPT-4, Llama 3, Nemotron)
-  **Contributor Insights**: Visualization of top contributors and recent activity
-  **Actionable Improvements**: AI-generated suggestions referencing specific file paths
-  **🛡️ Security Analysis**: Identifies security vulnerabilities with severity levels and recommendations
-  **⚡ Performance Insights**: Detects performance bottlenecks and optimization opportunities
-  **🎯 Smart File Selection**: Groq AI intelligently identifies 10-15 most critical files to analyze
-  **Smart Caching**: MongoDB-based caching strategy (24h) to reduce API costs
-  **Dynamic Model Selection**: Switch AI providers via environment variables without code changes
-  **Responsive UI**: Glassmorphic design with purple theme optimized for desktop and mobile
-  **Secure**: API keys stored server-side only, never exposed to frontend

---

##  Prerequisites

Before you begin, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (free tier sufficient) - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **GitHub Personal Access Token** - [Generate here](https://github.com/settings/tokens) (needs `repo` scope)
- **Google Gemini API Key** - [Get key key](https://makersuite.google.com/app/apikey)
- **OpenRouter API Key** - [Get key here](https://openrouter.ai/keys)

---

##  Installation

### 1. Clone the repository

```bash
git clone https://github.com/tharunprinz/GITPEN-AI.git
cd GITPEN-AI
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configuration

#### Backend Environment Variables

Create a file named `backend/.env` and add the following:

```env
# Server Configuration
PORT=5001

# MongoDB Atlas Connection
MONGODB_URI=mongodb_url

# GitHub API Token (Required)
GITHUB_TOKEN=ghp_your_github_personal_access_token

# Google Gemini API (Primary AI for Analysis)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq API (NEW - For Deep Code Analysis)
GROQ_API_KEY=your_groq_api_key_here

# OpenRouter API (For Chat Feature)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Fallback/custom models (optional)
CHAT_MODEL=meta-llama/llama-3.1-70b-instruct
```

**Important Notes:**
- `GITHUB_TOKEN`: Generate at https://github.com/settings/tokens with `repo` scope
- `MONGODB_URI`: Get from MongoDB Atlas → Connect → Drivers
- `GEMINI_API_KEY`: Free tier available at Google AI Studio
- `GROQ_API_KEY`: **NEW** - Get free key at https://console.groq.com/keys (for code analysis)
- `OPENROUTER_API_KEY`: Required for chat functionality

#### Frontend Environment Variables

Create a file named `frontend/.env` and add:

```env
VITE_API_URL=http://localhost:5001
```

---

##  Usage

### 1. Start the backend server

```bash
cd backend
npm run dev
```

The backend will run on **http://localhost:5001**

### 2. Start the frontend development server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on **http://localhost:5173**

### 3. Analyze a repository

1. Open your browser and navigate to **http://localhost:5173** (or 3000)
2. Enter a public GitHub repository URL (e.g., `https://github.com/expressjs/express`)
3. Click **Analyze** and wait for the AI to process the repository
4. View the dashboard with insights, health score, and improvements
5. Use the **AI Chat** to ask questions about the repository

---

##  Project Structure

```
GITPEN-AI/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── scanController.js      # Analysis logic
│   │   └── chatController.js      # Chat logic
│   ├── models/
│   │   ├── Scan.js                # MongoDB schema for scans
│   │   └── ChatSession.js         # MongoDB schema for chat
│   ├── routes/
│   │   ├── scanRoutes.js          # Scan API routes
│   │   └── chatRoutes.js          # Chat API routes
│   ├── services/
│   │   ├── geminiService.js       # Gemini AI service
│   │   ├── githubService.js       # GitHub API client
│   │   ├── groqService.js         # Groq AI service
│   │   └── openRouterService.js   # OpenRouter chat service
│   ├── scratch/                   # Scratch test files
│   ├── .env                       # Environment variables
│   ├── server.js                  # Express server
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Dashboard.jsx      # Analysis dashboard
│   │   │   └── ScanDetails.jsx    # Scan details and chat
│   │   ├── services/
│   │   │   └── api.js             # Axios API client
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Main styles
│   ├── .env                       # Frontend environment
│   ├── tailwind.config.js         # Tailwind configuration
│   ├── vite.config.js             # Vite configuration
│   └── package.json
│
├── .gitignore
├── package.json                   # Root dependencies
└── README.md                      # This file
```

---

##  API Endpoints

### Analyze Repository

```http
POST /api/scan
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repo"
}
```

### Chat with Repository

```http
POST /api/chat/:scanId
Content-Type: application/json

{
  "message": "What does this project do?"
}
```

### Get Scan History

```http
GET /api/scan/history
```

### Get Scan Details

```http
GET /api/scan/:id
```

### Get File Content

```http
GET /api/scan/:id/file?path=path/to/file.js
```

---

##  Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/improvement
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add improvement'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/improvement
   ```
5. **Open a Pull Request**

Please include:
- Clear description of changes
- Screenshots for UI changes
- Test results or manual verification steps

---

##  Tech Stack

### Frontend
- React - UI library
- Vite - Build tool
- React Router - Routing
- Tailwind CSS - Styling
- Lucide React - Icons
- React Hot Toast - Notifications
- Axios - HTTP client

### Backend
- Node.js - Runtime
- Express - Web framework
- MongoDB + Mongoose - Database
- Google Generative AI - Gemini integration
- OpenRouter SDK - Multi-model AI
- Groq SDK - Fast inference
- Axios - GitHub API client
- CORS - Cross-origin support
- dotenv - Environment config

---

##  License

This project is licensed under the **MIT License**.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

**Author: [tharunprinz](https://github.com/tharunprinz)**

*Security through intelligent code analysis*

</div>
