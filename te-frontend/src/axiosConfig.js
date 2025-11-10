import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/v1/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Use sessionStorage for tab-independent auth
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
        
        // Determine which login page to use based on previous role
        const wasPrivileged = sessionStorage.getItem('wasPrivilegedUser') === 'true';
        const loginPath = wasPrivileged ? '/lead-login' : '/login';
        
        alert('Your session has expired. Please log in again.');
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
