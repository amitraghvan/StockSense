'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@stocksense/ui';
import {
  Activity,
  Package,
  Warehouse,
  ArrowLeftRight,
  History,
  Settings,
  Lock,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  phase?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Foundation & Health',
    href: '/',
    icon: Activity,
  },
  {
    name: 'Products & SKUs',
    href: '#',
    icon: Package,
    disabled: true,
    phase: 'Phase 02',
  },
  {
    name: 'Warehouses',
    href: '#',
    icon: Warehouse,
    disabled: true,
    phase: 'Phase 03',
  },
  {
    name: 'Movements & Transfers',
    href: '#',
    icon: ArrowLeftRight,
    disabled: true,
    phase: 'Phase 04',
  },
  {
    name: 'Move History',
    href: '#',
    icon: History,
    disabled: true,
    phase: 'Phase 04',
  },
  {
    name: 'Settings & Access',
    href: '#',
    icon: Settings,
    disabled: true,
    phase: 'Phase 05',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-col border-r bg-card/60 backdrop-blur-sm hidden md:flex shrink-0">
      <div className="flex flex-col gap-1 p-4">
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Core Foundation
        </span>
        <div className="space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href && !item.disabled;
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" />
                    {item.phase}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-border/50">
        <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1 border border-border/40">
          <p className="font-medium text-foreground">StockSense Core v0.1.0</p>
          <p className="text-[11px] leading-relaxed">
            Phase 01 Production Engineering Foundation established.
          </p>
        </div>
      </div>
    </aside>
  );
}
