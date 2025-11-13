import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/v1/',
  timeout: 45000, // 45 seconds for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Use localStorage for cross-tab auth persistence
    const token = localStorage.getItem('accessToken');
    const isGuestMode = localStorage.getItem('isGuestMode') === 'true';

    // Do NOT attach an Authorization header for guest mode to avoid backend 401 redirect noise
    if (token && token !== 'guest-mode' && !isGuestMode) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Track request start time
    config.metadata = {
      startTime: new Date().getTime(),
    };

    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Log slow requests for monitoring
    if (response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime;
      
      if (duration > 5000) {
        console.info(`⚠️ Slow request: ${response.config.url} took ${(duration/1000).toFixed(1)}s`);
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const isGuestMode = localStorage.getItem('isGuestMode') === 'true';
      const token = localStorage.getItem('accessToken');

      // If guest mode, suppress redirect logic entirely; guests are expected to have limited/no backend access
      if (isGuestMode || token === 'guest-mode') {
        return Promise.reject(error);
      }

      // Clear auth data from sessionStorage (legacy/session based)
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('userRole');

      const currentPath = window.location.pathname;
      const isAlreadyOnLogin = currentPath === '/login' || currentPath === '/lead-login';

      if (!isAlreadyOnLogin) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        sessionStorage.setItem('sessionExpired', 'true');
        const wasPrivileged = sessionStorage.getItem('wasPrivilegedUser') === 'true';
        const loginPath = wasPrivileged ? '/lead-login' : '/login';
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
