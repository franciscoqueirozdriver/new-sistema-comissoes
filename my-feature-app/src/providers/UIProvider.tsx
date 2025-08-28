"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// This is a placeholder for a more complex UI provider.
// In a real app, this would be integrated with a toast library like 'sonner'
// and a modal system.

// Define the context value
interface UIContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  // Add other UI methods like showModal, hideModal, etc.
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

// The provider component
export const UIProvider = ({ children }: { children: ReactNode }) => {
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // In a real implementation, you would call your toast library here.
    // For this mock, we'll just log to the console.
    console.log(`[${type.toUpperCase()}] Toast: ${message}`);
    // You could also implement a simple on-screen message system here if needed for demos.
  };

  const value: UIContextValue = {
    showToast,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      {/* If using a library like 'sonner', you would render its Toaster component here */}
      {/* <Toaster /> */}
    </UIContext.Provider>
  );
};

// The hook to be used in components
export const useUI = (): UIContextValue => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
