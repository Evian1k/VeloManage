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
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  // ============ MESSAGE METHODS ============
  async getMessages(conversationId = null) {
    const params = conversationId ? `?conversation_id=${conversationId}` : '';
    return this.request(`/messages${params}`);
  }

  async getConversations() {
    return this.request('/messages/conversations');
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

  async markConversationAsRead(conversationId) {
    return this.request(`/messages/conversation/${conversationId}/read`, {
      method: 'PUT',
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/messages/${messageId}`, {
      method: 'DELETE',
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

  async updateService(serviceId, updateData) {
    return this.request(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteService(serviceId) {
    return this.request(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // ============ TRUCK METHODS ============
  async getTrucks(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const query = params ? `?${params}` : '';
    return this.request(`/trucks${query}`);
  }

  async createTruck(truckData) {
    return this.request('/trucks', {
      method: 'POST',
      body: JSON.stringify(truckData),
    });
  }

  async updateTruck(truckId, updateData) {
    return this.request(`/trucks/${truckId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteTruck(truckId) {
    return this.request(`/trucks/${truckId}`, {
      method: 'DELETE',
    });
  }

  async dispatchTruck(truckId, serviceRequestId, estimatedArrival = null) {
    return this.request(`/trucks/${truckId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify({
        service_request_id: serviceRequestId,
        estimated_arrival: estimatedArrival
      }),
    });
  }

  async completeTruckService(truckId, completionNotes = '') {
    return this.request(`/trucks/${truckId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completion_notes: completionNotes }),
    });
  }

  async updateTruckLocation(truckId, latitude, longitude) {
    return this.request(`/trucks/${truckId}/location`, {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async getTruckAnalytics() {
    return this.request('/trucks/analytics');
  }

  // ============ BRANCH METHODS ============
  async getBranches() {
    return this.request('/branches');
  }

  async getBranch(branchId) {
    return this.request(`/branches/${branchId}`);
  }

  async createBranch(branchData) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(branchId, updateData) {
    return this.request(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteBranch(branchId) {
    return this.request(`/branches/${branchId}`, {
      method: 'DELETE',
    });
  }

  async getBranchAnalytics(branchId) {
    return this.request(`/branches/${branchId}/analytics`);
  }

  async addStaffMember(branchId, staffData) {
    return this.request(`/branches/${branchId}/staff`, {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async removeStaffMember(branchId, staffId) {
    return this.request(`/branches/${branchId}/staff/${staffId}`, {
      method: 'DELETE',
    });
  }

  // ============ ANALYTICS METHODS ============
  async getDashboardAnalytics(period = '30') {
    return this.request(`/analytics/dashboard?period=${period}`);
  }

  async getFleetAnalytics() {
    return this.request('/analytics/fleet');
  }

  async getUserAnalytics() {
    return this.request('/analytics/users');
  }

  async getRevenueAnalytics() {
    return this.request('/analytics/revenue');
  }

  async exportAnalytics(type = 'services', format = 'json', startDate = null, endDate = null) {
    const params = new URLSearchParams({ type, format });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request(`/analytics/export?${params.toString()}`);
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

// Create singleton instance
const apiService = new ApiService();

// Auto-detect backend availability and log status
apiService.isBackendAvailable().then(available => {
  if (available) {
    console.log('✅ Backend connected - Using API mode');
  } else {
    console.log('⚠️ Backend unavailable - Falling back to localStorage mode');
  }
});

export default apiService;