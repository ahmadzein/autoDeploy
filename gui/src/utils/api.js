import axios from 'axios';

// Default API configuration - use import.meta.env for Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project management
export const projectAPI = {
  // Get all projects
  getAll: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Get single project
  getOne: async (projectName) => {
    const response = await api.get(`/projects/${encodeURIComponent(projectName)}`);
    return response.data;
  },

  // Add new project
  add: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project
  update: async (projectName, projectData) => {
    const response = await api.put(`/projects/${encodeURIComponent(projectName)}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (projectName) => {
    const response = await api.delete(`/projects/${encodeURIComponent(projectName)}`);
    return response.data;
  },

  // Test connection
  testConnection: async (sshData) => {
    const response = await api.post('/test-connection', sshData);
    return response.data;
  },

  // Get sub-deployments for monorepo
  getSubDeployments: async (projectName) => {
    const response = await api.get(`/projects/${encodeURIComponent(projectName)}/sub-deployments`);
    return response.data;
  },

  // Add sub-deployment to monorepo
  addSubDeployment: async (projectName, subData) => {
    const response = await api.post(`/projects/${encodeURIComponent(projectName)}/sub-deployments`, subData);
    return response.data;
  },

  // Update sub-deployment
  updateSubDeployment: async (projectName, subName, subData) => {
    const response = await api.put(`/projects/${encodeURIComponent(projectName)}/sub-deployments/${encodeURIComponent(subName)}`, subData);
    return response.data;
  },

  // Delete sub-deployment
  deleteSubDeployment: async (projectName, subName) => {
    const response = await api.delete(`/projects/${encodeURIComponent(projectName)}/sub-deployments/${encodeURIComponent(subName)}`);
    return response.data;
  },
};

// Deployment management
export const deploymentAPI = {
  // Deploy project
  deploy: async (projectName, options = {}) => {
    const response = await api.post(`/deployments/${encodeURIComponent(projectName)}`, options);
    return response.data;
  },

  // Get deployment status
  getStatus: async (projectName, deploymentId) => {
    const response = await api.get(`/deployments/${encodeURIComponent(projectName)}/${deploymentId}`);
    return response.data;
  },

  // Get deployment history
  getHistory: async (projectName) => {
    const response = await api.get(`/deployments/${projectName}/history`);
    return response.data;
  },

  // Stop deployment
  stop: async (projectName, deploymentId) => {
    const response = await api.post(`/deployments/${projectName}/${deploymentId}/stop`);
    return response.data;
  },

  // Get deployment logs
  getLogs: async (projectName, deploymentId) => {
    const response = await api.get(`/deployments/${projectName}/${deploymentId}/logs`);
    return response.data;
  },

  // Stream deployment logs (using EventSource)
  streamLogs: (projectName, deploymentId, onMessage, onError) => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/deployments/${projectName}/${deploymentId}/logs/stream`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };
    
    return eventSource;
  },
};

// Pipeline management
export const pipelineAPI = {
  // Validate pipeline
  validate: async (projectName) => {
    const response = await api.post(`/pipelines/${projectName}/validate`);
    return response.data;
  },

  // Get pipeline info
  getInfo: async (projectName) => {
    const response = await api.get(`/pipelines/${encodeURIComponent(projectName)}`);
    return response.data;
  },
};

// System management
export const systemAPI = {
  // Get system status
  getStatus: async () => {
    const response = await api.get('/system/status');
    return response.data;
  },

  // Get version info
  getVersion: async () => {
    const response = await api.get('/system/version');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get deployment stats
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
};

// Documentation
export const docsAPI = {
  // Get documentation content
  getContent: async (section, page) => {
    const response = await api.get(`/docs/${section}/${page}`);
    return response.data;
  },

  // Search documentation
  search: async (query) => {
    const response = await api.get('/docs/search', { params: { q: query } });
    return response.data;
  },

  // Get documentation structure
  getStructure: async () => {
    const response = await api.get('/docs/structure');
    return response.data;
  },
};

export default api;