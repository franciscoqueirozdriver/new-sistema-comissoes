'use client';
import React, { createContext, useContext, useState } from 'react';

export interface ImportData {
  columns: string[];
  rows: string[][];
}

export interface GlobalImportContextValue {
  isOpen: boolean;
  data: ImportData | null;
  mapping: Record<string, string>;
  requiredFields: string[];
  targetEndpoint: string;
  openModal: () => void;
  closeModal: () => void;
  setData: (data: ImportData | null) => void;
  setMapping: (map: Record<string, string>) => void;
}

const GlobalImportContext = createContext<GlobalImportContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  requiredFields?: string[];
  targetEndpoint?: string;
}

export function GlobalImportProvider({
  children,
  requiredFields = [],
  targetEndpoint = '/api/commissions/import',
}: ProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ImportData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <GlobalImportContext.Provider
      value={{
        isOpen,
        data,
        mapping,
        requiredFields,
        targetEndpoint,
        openModal,
        closeModal,
        setData,
        setMapping,
      }}
    >
      {children}
    </GlobalImportContext.Provider>
  );
}

export function useGlobalImport() {
  const ctx = useContext(GlobalImportContext);
  if (!ctx) throw new Error('useGlobalImport must be used within GlobalImportProvider');
  return ctx;
}
