'use client';
import React, { createContext, useContext, useState } from 'react';
import { importConfig } from '@/app/config/importConfig';

export interface ImportData {
  columns: string[];
  rows: string[][];
}

type DataType = 'pagamentos' | 'oportunidades' | 'dsr';

interface GlobalImportContextValue {
  isOpen: boolean;
  dataType: DataType | null;
  data: ImportData | null;
  mapping: Record<string, string>;
  requiredFields: string[];
  availableFields: string[];
  openImportModal: (type: DataType) => void;
  closeModal: () => void;
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
  const [targetEndpoint, setTargetEndpoint] = useState('/api/commissions/import');

  const endpointMap: Record<DataType, string> = {
    pagamentos: '/api/commissions/import',
    oportunidades: '/api/commissions/import',
    dsr: '/api/holerites',
  };

  const openImportModal = (type: DataType) => {
    setDataType(type);
    setMapping({});
    setData(null);
    setTargetEndpoint(endpointMap[type]);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setData(null);
    setDataType(null);
    setMapping({});
  };

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
        closeModal,
        setData,
        setMapping,
        targetEndpoint,
      }}
    >
      {children}
    </GlobalImportContext.Provider>
  );
}

export function useImportContext() {
  const ctx = useContext(GlobalImportContext);
  if (!ctx) throw new Error('useImportContext must be used within GlobalImportProvider');
  return ctx;
}

// Backwards compatibility alias
export const useGlobalImport = useImportContext;
