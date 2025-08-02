import './globals.css';
import { GlobalImportProvider } from './context/GlobalImportContext';
import ImportModal from '../components/ImportModal';

export const metadata = {
  title: 'Import Demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GlobalImportProvider
          requiredFields={['Client', 'Value', 'Date', 'Meetings']}
          targetEndpoint="/api/commissions/import"
        >
          {children}
          <ImportModal />
        </GlobalImportProvider>
      </body>
    </html>
  );
}
