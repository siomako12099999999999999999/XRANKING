import React from 'react';

export interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "h-8 w-8", 
  color = "border-blue-500" 
}) => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 ${color}`}></div>
    </div>
  );
};

export default LoadingSpinner;