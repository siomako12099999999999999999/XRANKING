'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import FullPageLoader from '@/components/FullPageLoader';

interface LoadingContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('ロード中...');

  const showLoader = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader, isLoading: loading }}>
      {children}
      {loading && <FullPageLoader message={message} />}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};