import axios from 'axios';

// Axios instance — uses VITE_API_URL in production (set in Vercel dashboard)
// Falls back to empty string which uses Vite's dev proxy on localhost
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s — individual polling requests are fast; scan runs in background
});

/**
 * Start an async repository scan.
 * Returns { jobId, status: "pending" } immediately — does NOT block.
 */
export const triggerScan = async (repoUrl) => {
  const response = await api.post('/api/scan', { repoUrl });
  return response.data; // { jobId, status, phase }
};

/**
 * Poll the status of a running scan job.
 * Call every 3s until status === "completed" or "failed".
 * Returns { jobId, status, phase, scanId? }
 */
export const getScanStatus = async (jobId) => {
  const response = await api.get(`/api/scan/status/${jobId}`);
  return response.data;
};

/**
 * Get the history of scanned repositories
 */
export const getScanHistory = async () => {
  const response = await api.get('/api/scan/history');
  return response.data;
};

/**
 * Get details of a single scan by ID
 */
export const getScanDetails = async (id) => {
  const response = await api.get(`/api/scan/${id}`);
  return response.data;
};

/**
 * Get the content of a file from scanned repository
 */
export const getFileContent = async (id, path) => {
  const response = await api.get(`/api/scan/${id}/file`, {
    params: { path },
  });
  return response.data.content;
};

/**
 * Send a chat message to the assistant
 */
export const sendChatMessage = async (scanId, message) => {
  const response = await api.post(`/api/chat/${scanId}`, { message });
  return response.data;
};

/**
 * Get chat messages history for a scan
 */
export const getChatSession = async (scanId) => {
  const response = await api.get(`/api/chat/${scanId}`);
  return response.data;
};

export default {
  triggerScan,
  getScanStatus,
  getScanHistory,
  getScanDetails,
  getFileContent,
  sendChatMessage,
  getChatSession,
};
