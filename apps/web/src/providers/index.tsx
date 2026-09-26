'use client';

import * as React from 'react';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
