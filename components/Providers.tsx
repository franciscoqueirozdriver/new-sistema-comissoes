"use client";

import { SessionProvider } from "next-auth/react";
import { GlobalImportProvider } from "./GlobalImportProvider";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <GlobalImportProvider>{children}</GlobalImportProvider>
    </SessionProvider>
  );
}
