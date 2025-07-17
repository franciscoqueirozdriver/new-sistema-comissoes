// /pages/_app.js (Versão Atualizada)

import { SessionProvider } from "next-auth/react";
import '../styles/globals.css';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  // Envolve o Layout com o SessionProvider
  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
