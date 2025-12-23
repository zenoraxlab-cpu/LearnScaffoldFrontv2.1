// src/services/api.js

const BACKEND_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://learnscaffold-backend.onrender.com';

const API_BASE = BACKEND_URL;

class ApiService {
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
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Analyze init failed');
    }

    const data = await response.json();

    // 🔑 ВАЖНО: сохраняем ВСЮ инфу о документе
    return {
      task_id: data.task_id,
      pages: data.pages,

      document_type: data.document_type || '',
      document_summary: data.document_summary || '',

      suggested_plan: {
        days: data.suggested_plan?.days || 10,
        hours_per_day: data.suggested_plan?.hours_per_day || 3,
      },

      estimated_processing_time_min: data.estimated_processing_time_min || 15,
    };
  }

  // ====================
  // GENERATE
  // ====================
  async startGeneration(taskId, days, language = 'ru') {
    const response = await fetch(`${API_BASE}/analyze/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId, // ⬅️ ИМЕННО task_id
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
}

export const apiService = new ApiService();
export default apiService;
