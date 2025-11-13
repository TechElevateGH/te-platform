import { useCallback } from 'react';
import { useLoading } from '../context/LoadingContext';
import axiosInstance from '../axiosConfig';

/**
 * Hook that provides axios instance with automatic loading state management
 * Automatically shows cold start indicator for requests taking > 5 seconds
 */
export const useAxios = () => {
  const { startLoading, stopLoading } = useLoading();

  const request = useCallback(async (config) => {
    const requestId = startLoading();
    
    try {
      const response = await axiosInstance(config);
      return response;
    } finally {
      stopLoading(requestId);
    }
  }, [startLoading, stopLoading]);

  const get = useCallback((url, config = {}) => {
    return request({ ...config, method: 'get', url });
  }, [request]);

  const post = useCallback((url, data, config = {}) => {
    return request({ ...config, method: 'post', url, data });
  }, [request]);

  const put = useCallback((url, data, config = {}) => {
    return request({ ...config, method: 'put', url, data });
  }, [request]);

  const patch = useCallback((url, data, config = {}) => {
    return request({ ...config, method: 'patch', url, data });
  }, [request]);

  const del = useCallback((url, config = {}) => {
    return request({ ...config, method: 'delete', url });
  }, [request]);

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    // Also expose the raw axios instance for advanced use
    axiosInstance
  };
};
