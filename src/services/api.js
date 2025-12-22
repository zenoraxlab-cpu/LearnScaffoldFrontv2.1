// src/services/api.js

const BACKEND_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://learnscaffold-backend.onrender.com';

const API_BASE = BACKEND_URL;

class ApiService {
  constructor() {
    this.useLegacyMode = false;
  }

  // ====================
  // INIT
  // ====================
  async initAnalysis(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/analyze/init`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  // ====================
  // 🚀 GENERATE (КЛЮЧЕВОЙ ФИКС)
  // ====================
  async startGeneration(taskId, days, language = 'ru') {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: taskId, // 🔑 ВАЖНО
        days,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    return response.json();
  }

  // ====================
  // STATUS
  // ====================
  async getTaskStatus(taskId) {
    const response = await fetch(`${API_BASE}/analyze/status/${taskId}`);

    if (!response.ok) {
      throw new Error('Status check failed');
    }

    return response.json();
  }

  // ====================
  // DOWNLOAD
  // ====================
  getDownloadUrl(taskId) {
    return `${API_BASE}/plan/${taskId}`;
  }

  // ====================
  // EMAIL
  // ====================
  async registerEmailNotification(taskId, email) {
    const response = await fetch(`${API_BASE}/notify/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, email }),
    });

    if (!response.ok) {
      throw new Error('Email registration failed');
    }

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
