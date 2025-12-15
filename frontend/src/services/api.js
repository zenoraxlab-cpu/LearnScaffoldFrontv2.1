const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

class ApiService {
  constructor() {
    this.useLegacyMode = false;
  }

  async checkApiMode() {
    // Try new API first, fall back to legacy if 404
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        this.useLegacyMode = false;
        return 'staged';
      }
    } catch (e) {
      console.log('Health check failed, will try legacy mode on upload');
    }
    return 'unknown';
  }

  // ==================== Staged API (New) ====================

  async initAnalysis(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/analyze/init`, {
      method: 'POST',
      body: formData
    });

    if (response.status === 404) {
      // Fall back to legacy mode
      this.useLegacyMode = true;
      return this.legacyUpload(file);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
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
        days: days,
        hours_per_day: hoursPerDay
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Generation failed' }));
      throw new Error(error.detail || 'Generation failed');
    }

    return response.json();
  }

  async getTaskStatus(taskId) {
    const response = await fetch(`${API_BASE}/analyze/status/${taskId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Status check failed' }));
      throw new Error(error.detail || 'Status check failed');
    }

    return response.json();
  }

  async registerEmailNotification(taskId, email) {
    const response = await fetch(`${API_BASE}/notify/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        email: email
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Email registration failed' }));
      throw new Error(error.detail || 'Email registration failed');
    }

    return response.json();
  }

  getDownloadUrl(taskId) {
    return `${API_BASE}/analyze/download/${taskId}`;
  }

  // ==================== Legacy API (Fallback) ====================

  async legacyUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Upload failed');
    }

    const data = await response.json();
    
    // Transform legacy response to match new API format
    return {
      task_id: data.file_id,
      filename: data.filename,
      file_type: file.name.split('.').pop(),
      file_size_bytes: file.size,
      pages_or_elements: Math.ceil(file.size / 50000),
      detected_language: 'en',
      suggested_plan: {
        recommended_days: 14,
        recommended_hours_per_day: 2.0,
        total_hours: 28
      },
      estimated_processing_time_min: 5,
      _legacy: true
    };
  }

  async legacyAnalyze(fileId) {
    const response = await fetch(`${API_BASE}/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId })
    });

    return response.json();
  }

  async legacyGetStatus(fileId) {
    const response = await fetch(`${API_BASE}/analyze/legacy/status/${fileId}`);
    return response.json();
  }

  async legacyGenerate(fileId, days, hoursPerDay) {
    const response = await fetch(`${API_BASE}/generate/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId,
        days: days,
        hours_per_day: hoursPerDay
      })
    });

    return response.json();
  }
}

export const apiService = new ApiService();
export default apiService;
