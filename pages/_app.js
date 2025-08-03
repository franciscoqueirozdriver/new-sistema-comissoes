// /pages/_app.js (Versão Atualizada)

import { SessionProvider } from "next-auth/react";
import '../styles/globals.css';
import Layout from '@/components/Layout';
import { GlobalImportProvider } from '@/app/context/GlobalImportContext';
import ImportModal from '@/components/ImportModal';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  // Envolve o Layout com o SessionProvider
  return (
    <SessionProvider session={session}>
      <GlobalImportProvider>
        <Layout>
          <Component {...pageProps} />
          <ImportModal />
        </Layout>
      </GlobalImportProvider>
    </SessionProvider>
  );
}
