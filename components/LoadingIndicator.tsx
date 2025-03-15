import React from 'react';

interface LoadingIndicatorProps {
  type?: 'dots' | 'bounce' | 'pulse' | 'bar' | 'spinner';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  type = 'dots',
  color = 'bg-blue-600 dark:bg-blue-500',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      wrapper: 'h-4',
      dots: 'w-1 h-1',
      bounce: 'w-1.5 h-1.5',
      pulse: 'w-1.5 h-1.5',
      bar: 'h-1',
      spinner: 'h-4 w-4'
    },
    md: {
      wrapper: 'h-6',
      dots: 'w-2 h-2',
      bounce: 'w-2.5 h-2.5',
      pulse: 'w-2.5 h-2.5',
      bar: 'h-1.5',
      spinner: 'h-6 w-6'
    },
    lg: {
      wrapper: 'h-8',
      dots: 'w-3 h-3',
      bounce: 'w-3.5 h-3.5',
      pulse: 'w-3.5 h-3.5',
      bar: 'h-2',
      spinner: 'h-8 w-8'
    }
  };

  switch (type) {
    case 'dots':
      return (
        <div className="flex items-center justify-center space-x-2">
          <div className={`${sizeClasses[size].dots} rounded-full ${color} animate-loader-dot1`}></div>
          <div className={`${sizeClasses[size].dots} rounded-full ${color} animate-loader-dot2`}></div>
          <div className={`${sizeClasses[size].dots} rounded-full ${color} animate-loader-dot3`}></div>
        </div>
      );
      
    case 'bounce':
      return (
        <div className="flex items-center justify-center space-x-1.5">
          <div className={`${sizeClasses[size].bounce} rounded-full ${color} animate-loader-bounce1`}></div>
          <div className={`${sizeClasses[size].bounce} rounded-full ${color} animate-loader-bounce2`}></div>
          <div className={`${sizeClasses[size].bounce} rounded-full ${color} animate-loader-bounce3`}></div>
        </div>
      );
      
    case 'pulse':
      return (
        <div className="relative flex justify-center items-center">
          <div className={`${sizeClasses[size].pulse} rounded-full ${color} animate-ping absolute`}></div>
          <div className={`${sizeClasses[size].pulse} rounded-full ${color}`}></div>
        </div>
      );
      
    case 'bar':
      return (
        <div className={`w-full ${sizeClasses[size].bar} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
          <div className={`${color} h-full animate-loader-bar`}></div>
        </div>
      );
      
    case 'spinner':
    default:
      return (
        <div className="flex justify-center items-center">
          <div className={`${sizeClasses[size].spinner} border-2 border-t-transparent ${color.replace('bg-', 'border-')} rounded-full animate-spin`}></div>
        </div>
      );
  }
};

export default LoadingIndicator;