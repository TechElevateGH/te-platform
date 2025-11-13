import { useState, useEffect } from 'react';

/**
 * ColdStartIndicator - Shows a friendly message when the backend is waking up
 * Useful for free-tier deployments that sleep after inactivity
 */
const ColdStartIndicator = ({ isLoading, timeoutReached }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isLoading || !timeoutReached) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading, timeoutReached]);

  if (!isLoading || !timeoutReached) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center">
          {/* Animated Icon */}
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 12h14M12 5l7 7-7 7" 
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Waking up the server{dots}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
            The backend is starting up. This usually takes 15-30 seconds on the first request.
          </p>
          
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            💡 Tip: Subsequent requests will be much faster!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ColdStartIndicator;
