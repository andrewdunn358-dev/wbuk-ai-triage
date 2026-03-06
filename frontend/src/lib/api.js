import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${API_URL}/api`;

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Session APIs
export const createSession = async (userAgentHash = null) => {
  const response = await apiClient.post('/session/create', { user_agent_hash: userAgentHash });
  return response.data;
};

export const verifySession = async (sessionToken) => {
  const response = await apiClient.get(`/session/verify/${sessionToken}`);
  return response.data;
};

// Chat APIs
export const startChat = async (sessionToken) => {
  const response = await apiClient.post(`/chat/start/${sessionToken}`);
  return response.data;
};

export const sendMessage = async (sessionToken, content) => {
  const response = await apiClient.post('/chat/message', {
    session_token: sessionToken,
    content,
  });
  return response.data;
};

export const getChatHistory = async (sessionToken) => {
  const response = await apiClient.get(`/chat/history/${sessionToken}`);
  return response.data;
};

// Triage APIs
export const generateSummary = async (sessionToken) => {
  const response = await apiClient.post(`/triage/generate-summary/${sessionToken}`);
  return response.data;
};

export const submitCase = async (sessionToken) => {
  const response = await apiClient.post('/triage/submit', {
    session_token: sessionToken,
  });
  return response.data;
};

// Admin Auth APIs
export const adminLogin = async (email, password) => {
  const response = await apiClient.post('/admin/auth/login', { email, password });
  return response.data;
};

export const adminLogout = async () => {
  const response = await apiClient.post('/admin/auth/logout');
  localStorage.removeItem('adminToken');
  return response.data;
};

export const getCurrentAdmin = async () => {
  const response = await apiClient.get('/admin/auth/me');
  return response.data;
};

// Admin Case APIs
export const getCases = async (params = {}) => {
  const response = await apiClient.get('/admin/cases', { params });
  return response.data;
};

export const getCaseDetail = async (caseReference) => {
  const response = await apiClient.get(`/admin/cases/${caseReference}`);
  return response.data;
};

export const updateCaseStatus = async (caseReference, status, notes = null) => {
  const response = await apiClient.patch(`/admin/cases/${caseReference}/status`, { status, notes });
  return response.data;
};

export const addCaseNote = async (caseReference, content, isInternal = true) => {
  const response = await apiClient.post(`/admin/cases/${caseReference}/notes`, { content, is_internal: isInternal });
  return response.data;
};

export const getAdminStats = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

export default apiClient;
