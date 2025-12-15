// src/services/api.js

const BACKEND_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://learnscaffold-backend.onrender.com';
const API_BASE = BACKEND_URL; // Убрали /api — у тебя бэкенд без префикса!

class ApiService {
  constructor() {
    this.useLegacyMode = false;
  }

  async checkApiMode() {
    try {
      const response = await fetch(`${API_BASE}/analyze/init`); // Просто проверяем доступность
      if (response.ok || response.status === 405) {
        // 405 тоже ок — значит эндпоинт существует
        this.useLegacyMode = false;
        return 'staged';
      }
    } catch (e) {
      console.log('New API not available, trying legacy');
    }
    this.useLegacyMode = true;
    return 'legacy';
  }

  // ==================== Staged API (New) ====================

  async initAnalysis(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/analyze/init`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 404) {
      this.useLegacyMode = true;
      return this.legacyUpload(file);
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  async startGeneration(taskId, days, hoursPerDay) {
    const response = await fetch(`${API_BASE}/analyze/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        days,
        hours_per_day: hoursPerDay,
      }),
    });

    if (!response.ok) {
      throw new Error('Generation failed');
    }

    return response.json();
  }

  async getTaskStatus(taskId) {
    const response = await fetch(`${API_BASE}/analyze/status/${taskId}`);

    if (!response.ok) {
      throw new Error('Status check failed');
    }

    return response.json();
  }

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

  getDownloadUrl(taskId) {
    return `${API_BASE}/analyze/download/${taskId}`; // Если добавишь download эндпоинт
  }

  // ==================== Legacy Fallback ====================

  async legacyUpload(file) {
    // Твой legacy flow, если нужен
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/analyze/`, {
      // Или /upload/ — как у тебя было
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Legacy upload failed');
    }

    const data = await response.json();
    // Приводим к формату staged
    return {
      task_id: data.file_id || 'legacy-' + Date.now(),
      pages: data.pages || 100,
      detected_language: data.document_language || 'EN',
      size_mb: (file.size / 1024 / 1024).toFixed(1),
      suggested_plan: {
        days: data.recommended_days || 10,
        hours_per_day: 3,
      },
      estimated_processing_time_min: 15,
    };
  }
}

export const apiService = new ApiService();
export default apiService;
