import { useState, useCallback } from 'react';
import { isColdStartError } from '../utils/healthCheck';

/**
 * Custom hook for API requests with built-in cold start handling
 * 
 * Usage:
 * const { data, loading, error, execute } = useApiRequest();
 * 
 * // In your component:
 * useEffect(() => {
 *   execute(() => axiosInstance.get('/applications'));
 * }, []);
 */
export const useApiRequest = (options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isColdStart, setIsColdStart] = useState(false);

  const execute = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    setIsColdStart(false);

    try {
      const response = await requestFn();
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      
      // Check if it's a cold start error
      if (isColdStartError(err)) {
        setIsColdStart(true);
      }
      
      // Optional: Retry on cold start
      if (options.retryOnColdStart && isColdStartError(err)) {
        console.info('Cold start detected, retrying request...');
        try {
          const retryResponse = await requestFn();
          setData(retryResponse.data);
          setError(null);
          return retryResponse.data;
        } catch (retryErr) {
          setError(retryErr);
          throw retryErr;
        }
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options.retryOnColdStart]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setIsColdStart(false);
  }, []);

  return { 
    data, 
    loading, 
    error, 
    isColdStart,
    execute, 
    reset 
  };
};

/**
 * Example usage in a component:
 * 
 * function MyComponent() {
 *   const { data, loading, error, execute } = useApiRequest();
 * 
 *   useEffect(() => {
 *     execute(() => axiosInstance.get('/api/data'));
 *   }, []);
 * 
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 */
