'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isAuthRoute && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
}
