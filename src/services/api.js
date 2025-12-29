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
        task_id: taskId,
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
  // DOWNLOAD (POST /plan/pdf)
  // ====================
  async downloadPlanPdf(taskId) {
    const response = await fetch(`${API_BASE}/plan/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('PDF download failed:', response.status, text);
      throw new Error('PDF generation failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-plan.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }
}

export const apiService = new ApiService();
export default apiService;
