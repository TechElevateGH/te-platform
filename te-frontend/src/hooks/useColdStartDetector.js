import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect potential cold starts based on request duration
 * Returns state to control the cold start indicator
 */
const useColdStartDetector = () => {
  const [isSlowRequest, setIsSlowRequest] = useState(false);
  const [showColdStartUI, setShowColdStartUI] = useState(false);
  const requestTimers = useRef(new Map());

  // Track request start
  const trackRequestStart = (requestId) => {
    const timer = setTimeout(() => {
      setIsSlowRequest(true);
      setShowColdStartUI(true);
    }, 3000); // Show indicator after 3 seconds

    requestTimers.current.set(requestId, timer);
  };

  // Track request end
  const trackRequestEnd = (requestId) => {
    const timer = requestTimers.current.get(requestId);
    if (timer) {
      clearTimeout(timer);
      requestTimers.current.delete(requestId);
    }

    // Hide UI after a brief delay
    setTimeout(() => {
      if (requestTimers.current.size === 0) {
        setIsSlowRequest(false);
        setShowColdStartUI(false);
      }
    }, 500);
  };

  // Cleanup on unmount
  useEffect(() => {
    const timers = requestTimers.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return {
    isSlowRequest,
    showColdStartUI,
    trackRequestStart,
    trackRequestEnd,
  };
};

export default useColdStartDetector;
