import React from 'react';

export interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'h-5 w-5',
  color = 'border-white'
}) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${size} ${color}`}
      role="status"
      aria-label="読み込み中"
    />
  );
};

export default LoadingSpinner;