import React from 'react';

const TweetSkeleton = () => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent pb-8 pt-20 px-4">
        <div className="flex items-center mb-2">
          <div className="h-10 w-10 rounded-full bg-gray-800 animate-pulse"></div>
          <div className="ml-2">
            <div className="h-4 w-24 bg-gray-800 rounded mb-1 animate-pulse"></div>
            <div className="h-3 w-20 bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="h-16 w-full bg-gray-800 rounded mb-4 animate-pulse"></div>
        <div className="flex items-center space-x-4">
          <div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default TweetSkeleton;