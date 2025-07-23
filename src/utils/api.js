// Frontend API service for AutoCare Pro backend
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('autocare_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('autocare_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('autocare_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ============ AUTH METHODS ============
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    this.clearToken();
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // ============ SERVICE METHODS ============
  async getServices() {
    return this.request('/services');
  }

  async createService(serviceData) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(serviceId, serviceData) {
    return this.request(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(serviceId) {
    return this.request(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // ============ MESSAGE METHODS ============
  async getMessages(conversationId = null) {
    const endpoint = conversationId ? `/messages?conversation_id=${conversationId}` : '/messages';
    return this.request(endpoint);
  }

  async sendMessage(message, receiverId = null, conversationId = null) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({
        message,
        receiver_id: receiverId,
        conversation_id: conversationId
      }),
    });
  }

  async markMessageAsRead(messageId) {
    return this.request(`/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async getConversations() {
    return this.request('/messages/conversations');
  }

  // ============ UTILITY METHODS ============
  async checkBackendHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return await response.json();
    } catch (error) {
      console.warn('Backend not available:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if backend is available
  async isBackendAvailable() {
    try {
      const health = await this.checkBackendHealth();
      return health.success === true;
    } catch {
      return false;
    }
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;