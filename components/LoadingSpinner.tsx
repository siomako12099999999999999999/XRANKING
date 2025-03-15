import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "h-6 w-6" }) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${size}`}></div>
    </div>
  );
};

export default LoadingSpinner;