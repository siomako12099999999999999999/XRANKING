import React from 'react';
import { FaBars, FaTimes, FaTwitter } from 'react-icons/fa';

interface LoadingSpinnerProps {
  size?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "h-6 w-6" }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${size}`}></div>
  );
};

export default LoadingSpinner;