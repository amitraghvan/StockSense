'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from '../../providers/theme-provider';
import { Button, DropdownMenu } from '@stocksense/ui';
import {
  Sun,
  Moon,
  Laptop,
  Search,
  User,
  Settings,
  Terminal,
  LogOut,
  Building2,
} from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm">
            S
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">StockSense</span>
        </Link>

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72 lg:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search operations, products, references..."
            className="h-9 w-full rounded-md border border-input bg-muted/30 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Warehouse Selector */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground font-medium">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span>Main Warehouse (WH/Stock)</span>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center border rounded-md p-0.5 bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${theme === 'light' ? 'bg-background shadow-xs text-foreground' : ''}`}
            onClick={() => setTheme('light')}
            aria-label="Light mode"
          >
            <Sun className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${theme === 'dark' ? 'bg-background shadow-xs text-foreground' : ''}`}
            onClick={() => setTheme('dark')}
            aria-label="Dark mode"
          >
            <Moon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-sm ${theme === 'system' ? 'bg-background shadow-xs text-foreground' : ''}`}
            onClick={() => setTheme('system')}
            aria-label="System mode"
          >
            <Laptop className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu
          trigger={
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary border border-primary/20 hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
              <User className="h-4 w-4" />
            </button>
          }
          items={[
            {
              label: 'StockSense Admin',
              onClick: () => {},
              disabled: true,
            },
            {
              label: 'Warehouse Settings',
              icon: <Settings className="h-4 w-4" />,
              onClick: () => {
                window.location.href = '/settings';
              },
            },
            {
              label: 'Developer Diagnostics',
              icon: <Terminal className="h-4 w-4" />,
              onClick: () => {
                window.location.href = '/internal/foundation';
              },
            },
            {
              label: 'Sign Out',
              icon: <LogOut className="h-4 w-4 text-destructive" />,
              destructive: true,
              onClick: () => {},
            },
          ]}
        />
      </div>
    </header>
  );
}
