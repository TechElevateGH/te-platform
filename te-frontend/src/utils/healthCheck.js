import axiosInstance from '../axiosConfig';

/**
 * Health Check Utility
 * Used to check if backend is responsive and warm it up if needed
 */

/**
 * Ping the backend health endpoint
 * Returns true if backend is responsive, false otherwise
 */
export const checkBackendHealth = async () => {
  try {
    const response = await axiosInstance.get('/health', { 
      timeout: 5000,
      // Don't trigger auth interceptors for health check
      headers: { 'Skip-Auth': 'true' }
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Backend health check failed:', error.message);
    return false;
  }
};

/**
 * Warm up the backend by making a lightweight request
 * Useful to call on app initialization to reduce cold start for users
 */
export const warmUpBackend = async () => {
  try {
    console.info('Warming up backend...');
    const startTime = Date.now();
    await checkBackendHealth();
    const duration = Date.now() - startTime;
    console.info(`Backend warmed up in ${duration}ms`);
    return true;
  } catch (error) {
    console.warn('Failed to warm up backend:', error.message);
    return false;
  }
};

/**
 * Keep backend alive by pinging periodically
 * Call this on app mount to prevent cold starts during user session
 * Returns a cleanup function to stop the keep-alive
 */
export const startKeepAlive = (intervalMinutes = 10) => {
  console.info(`Starting backend keep-alive (ping every ${intervalMinutes} minutes)`);
  
  // Initial warmup
  warmUpBackend();

  // Set up periodic ping
  const intervalId = setInterval(() => {
    warmUpBackend();
  }, intervalMinutes * 60 * 1000);

  // Return cleanup function
  return () => {
    console.info('Stopping backend keep-alive');
    clearInterval(intervalId);
  };
};

/**
 * Check if request error is due to cold start/timeout
 */
export const isColdStartError = (error) => {
  return (
    error.code === 'ECONNABORTED' || 
    error.message?.includes('timeout') ||
    error.message?.includes('Network Error')
  );
};
