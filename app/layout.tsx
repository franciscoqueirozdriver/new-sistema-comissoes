import './globals.css';
import { GlobalImportProvider } from './context/GlobalImportContext';
import ImportModal from '../components/ImportModal';
import { SessionProvider } from 'next-auth/react';

export const metadata = {
  title: 'Import Demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <GlobalImportProvider>
            {children}
            <ImportModal />
          </GlobalImportProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
