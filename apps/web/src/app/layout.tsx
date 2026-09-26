import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '../providers';
import { AppShell } from '../components/layout/app-shell';

export const metadata: Metadata = {
  title: 'StockSense — Modular Monolith Inventory & SaaS Platform',
  description:
    'StockSense enterprise inventory management foundation. Phase 01 production engineering baseline.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
