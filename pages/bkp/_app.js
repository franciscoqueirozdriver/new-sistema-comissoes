// /pages/_app.js

import '../styles/globals.css'
import Layout from '@/components/Layout' // Importe o componente Layout

export default function App({ Component, pageProps }) {
  // Envolve o Componente da página atual com o Layout
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
