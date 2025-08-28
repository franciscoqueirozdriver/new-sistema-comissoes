"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the session object
interface Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string; // Or Date
}

// Define the context value
interface SessionContextValue {
  data: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// The provider component
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Mock session data
  const mockSession: Session = {
    user: {
      name: 'Mock User',
      email: 'user@example.com',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const value: SessionContextValue = {
    data: mockSession,
    status: 'authenticated', // Or 'unauthenticated' to test that flow
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// The hook to be used in components
export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    // In a real scenario, you might want to default to a 'loading' or 'unauthenticated' state
    // if the hook is used outside of a provider. For this mock, we can throw an error
    // or return a default unauthenticated status.
    return { data: null, status: 'unauthenticated' };
  }
  return context;
};
