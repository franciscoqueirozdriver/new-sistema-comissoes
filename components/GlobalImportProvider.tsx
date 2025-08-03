"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import ImportModal from "./ImportModal";

interface GlobalImportContextValue {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const GlobalImportContext = createContext<GlobalImportContextValue | undefined>(undefined);

export function GlobalImportProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  return (
    <GlobalImportContext.Provider value={{ open, openModal, closeModal }}>
      {children}
      <ImportModal />
    </GlobalImportContext.Provider>
  );
}

export function useGlobalImport() {
  const ctx = useContext(GlobalImportContext);
  if (!ctx) throw new Error("useGlobalImport must be used within GlobalImportProvider");
  return ctx;
}
