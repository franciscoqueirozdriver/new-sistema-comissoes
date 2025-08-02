'use client';
import React, { createContext, useContext, useState } from 'react';
import { importConfig } from '@/lib/importConfig';

export interface ImportData {
  columns: string[];
  rows: string[][];
}

type DataType = 'payments' | 'opportunities';

interface GlobalImportContextValue {
  isOpen: boolean;
  dataType: DataType | null;
  data: ImportData | null;
  mapping: Record<string, string>;
  requiredFields: string[];
  availableFields: string[];
  openImportModal: (type: DataType) => void;
  closeImportModal: () => void;
  setData: (data: ImportData | null) => void;
  setMapping: (map: Record<string, string>) => void;
  targetEndpoint: string;
}

const GlobalImportContext = createContext<GlobalImportContextValue | undefined>(undefined);

export function GlobalImportProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dataType, setDataType] = useState<DataType | null>(null);
  const [data, setData] = useState<ImportData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const openImportModal = (type: DataType) => {
    setDataType(type);
    setMapping({});
    setData(null);
    setIsOpen(true);
  };
  const closeImportModal = () => setIsOpen(false);

  const config = dataType ? importConfig[dataType] : { requiredFields: [], mappings: [] };

  return (
    <GlobalImportContext.Provider
      value={{
        isOpen,
        dataType,
        data,
        mapping,
        requiredFields: config.requiredFields,
        availableFields: config.mappings,
        openImportModal,
        closeImportModal,
        setData,
        setMapping,
        targetEndpoint: '/api/commissions/import',
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
