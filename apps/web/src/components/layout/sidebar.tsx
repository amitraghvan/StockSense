'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@stocksense/ui';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  History,
  Settings,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { name: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Operations',
    href: '/operations',
    icon: ArrowLeftRight,
    subItems: [
      { name: 'Receipts', href: '/operations/receipts' },
      { name: 'Deliveries', href: '/operations/deliveries' },
    ],
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Move History',
    href: '/move-history',
    icon: History,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-col border-r bg-card/70 backdrop-blur-sm hidden md:flex shrink-0 select-none">
      <div className="flex flex-col gap-1 p-4">
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </span>
        <nav className="space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.subItems && (
                    <ChevronRight
                      className={cn(
                        'h-3.5 w-3.5 transition-transform opacity-70',
                        isActive ? 'rotate-90' : '',
                      )}
                    />
                  )}
                </Link>

                {/* Sub-navigation for operations */}
                {item.subItems && isActive && (
                  <div className="ml-7 pl-3 border-l space-y-1 py-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            'block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                            isSubActive
                              ? 'text-primary font-semibold bg-primary/10'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                          )}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status link (separated from product navigation) */}
      <div className="mt-auto p-4 border-t border-border/50">
        <Link
          href="/internal/foundation"
          className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground hover:bg-muted/80 transition-colors border border-border/40"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-foreground">Core Services</span>
          </div>
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>
    </aside>
  );
}
