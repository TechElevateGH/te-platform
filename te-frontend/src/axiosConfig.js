import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:8000/v1/',
  timeout: 45000, // Increased to 45 seconds for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global handlers for cold start detection
let coldStartHandlers = {
  onSlowRequest: () => {},
  onRequestComplete: () => {},
};

export const setColdStartHandlers = (handlers) => {
  coldStartHandlers = { ...coldStartHandlers, ...handlers };
};

// Add request interceptor to include auth token and track timing
axiosInstance.interceptors.request.use(
  (config) => {
    // Use sessionStorage for tab-independent auth
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Track request start time for cold start detection
    config.metadata = { 
      startTime: new Date().getTime(),
      requestId: `${config.method}-${config.url}-${Date.now()}` 
    };

    // Notify about request start (triggers cold start timer)
    const timer = setTimeout(() => {
      coldStartHandlers.onSlowRequest(config.metadata.requestId);
    }, 3000); // 3 second threshold

    config.metadata.timer = timer;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors and track timing
axiosInstance.interceptors.response.use(
  (response) => {
    // Clear the slow request timer and notify completion
    if (response.config.metadata) {
      clearTimeout(response.config.metadata.timer);
      const duration = new Date().getTime() - response.config.metadata.startTime;
      
      // Log slow requests for monitoring
      if (duration > 3000) {
        console.info(`Slow request detected: ${response.config.url} took ${duration}ms`);
      }

      coldStartHandlers.onRequestComplete(response.config.metadata.requestId);
    }
    return response;
  },
  (error) => {
    // Clear the slow request timer on error too
    if (error.config?.metadata) {
      clearTimeout(error.config.metadata.timer);
      coldStartHandlers.onRequestComplete(error.config.metadata.requestId);
    }

    if (error.response?.status === 401) {
      // Clear auth data from sessionStorage
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRole');
      
      // Show a user-friendly message
      const currentPath = window.location.pathname;
      const isAlreadyOnLogin = currentPath === '/login' || currentPath === '/lead-login';
      
      if (!isAlreadyOnLogin) {
        // Store the attempted URL to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        sessionStorage.setItem('sessionExpired', 'true');
        
        // Determine which login page to use based on previous role
        const wasPrivileged = sessionStorage.getItem('wasPrivilegedUser') === 'true';
        const loginPath = wasPrivileged ? '/lead-login' : '/login';
        
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
