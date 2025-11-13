import { useState, useEffect } from 'react';

/**
 * LoadingSpinner - Reusable loading indicator with cold start message
 * Shows enhanced message if loading takes too long (indicating cold start)
 */
const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  coldStartMessage = 'Server is waking up, please wait...',
  className = '' 
}) => {
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  useEffect(() => {
    // Show cold start message after 3 seconds
    const timer = setTimeout(() => {
      setShowColdStartMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClasses[size]}`}
      />
      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
        {showColdStartMessage ? coldStartMessage : message}
      </p>
      {showColdStartMessage && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
          ⏱️ First load may take up to 30 seconds
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
