// /pages/_app.js (Versão Atualizada)

import '../styles/globals.css';
import Layout from '@/components/Layout';
import Providers from '@/components/Providers';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <Providers session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Providers>
  );
}
