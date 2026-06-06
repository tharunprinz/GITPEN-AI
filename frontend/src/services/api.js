import axios from 'axios';

// Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Proxied locally, uses absolute URL in prod
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Scan a new GitHub repository
 */
export const triggerScan = async (repoUrl) => {
  const response = await api.post('/api/scan', { repoUrl });
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
  getScanHistory,
  getScanDetails,
  getFileContent,
  sendChatMessage,
  getChatSession,
};
