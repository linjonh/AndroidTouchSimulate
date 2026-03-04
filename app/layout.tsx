import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { LanguageProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'TouchTrace Analyzer',
  description: 'Android Touch Event Analysis and Simulation Tool',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="zh">
      <body suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
