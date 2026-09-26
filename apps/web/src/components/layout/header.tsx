'use client';

import * as React from 'react';
import { useTheme } from '../../providers/theme-provider';
import { Button, Badge } from '@stocksense/ui';
import { Sun, Moon, Laptop, ShieldCheck } from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm">
            S
          </span>
          StockSense
        </h1>
        <Badge variant="outline" className="hidden sm:inline-flex text-xs font-mono">
          Phase 01: Foundation
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Production Core Active</span>
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

        {/* User Avatar Placeholder */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary border border-primary/20">
          SS
        </div>
      </div>
    </header>
  );
}
