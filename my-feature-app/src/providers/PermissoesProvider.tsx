"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of permissions
type Permission = string;

// Define the context value
interface PermissoesContextValue {
  temPermissao: (permission: Permission) => boolean;
  getPermissoesDoUsuario: () => Permission[];
}

const PermissoesContext = createContext<PermissoesContextValue | undefined>(undefined);

// Mock permissions data
const mockPermissoes: Permission[] = [
  'calcular:dsr',
  'ver:relatorio',
  // Add other mock permissions as needed
];

// The provider component
export const PermissoesProvider = ({ children }: { children: ReactNode }) => {
  const temPermissao = (permission: Permission): boolean => {
    return mockPermissoes.includes(permission);
  };

  const getPermissoesDoUsuario = (): Permission[] => {
    return mockPermissoes;
  };

  const value: PermissoesContextValue = {
    temPermissao,
    getPermissoesDoUsuario,
  };

  return (
    <PermissoesContext.Provider value={value}>
      {children}
    </PermissoesContext.Provider>
  );
};

// The hook to be used in components
export const usePermissoes = (): PermissoesContextValue => {
  const context = useContext(PermissoesContext);
  if (context === undefined) {
    throw new Error('usePermissoes must be used within a PermissoesProvider');
  }
  return context;
};
