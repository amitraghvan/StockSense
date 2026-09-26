'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  Terminal,
  User,
  X,
} from 'lucide-react';
import { DropdownMenu, cn } from '@stocksense/ui';
import { useAuth } from '../../providers/auth-provider';

const navLink =
  'inline-flex h-12 items-center gap-1 border-b-2 border-transparent px-3 text-sm font-medium text-nav-foreground transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const activeNav = 'border-primary text-primary font-semibold';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, activeTenant, availableTenants, switchTenant, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [operationsOpen, setOperationsOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
    setOperationsOpen(false);
    setSettingsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isDashboard = pathname === '/' || pathname === '/dashboard';
  const isOperations =
    pathname.startsWith('/operations') ||
    pathname.startsWith('/receipts') ||
    pathname.startsWith('/deliveries');
  const isProducts = pathname.startsWith('/products');
  const isStock = pathname.startsWith('/stock');
  const isMoveHistory = pathname.startsWith('/move-history');
  const isSettings = pathname.startsWith('/settings');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-nav">
      <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-1 px-2 md:px-4">
        {/* Mobile menu trigger */}
        <button
          className="inline-flex size-9 items-center justify-center rounded-md hover:bg-surface-hover lg:hidden text-foreground"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        {/* Logo */}
        <Link
          href="/dashboard"
          className="mr-3 flex items-center gap-2 px-2 font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Boxes className="size-4" aria-hidden="true" />
          </span>
          <span className="tracking-tight text-base font-bold">StockSense</span>
        </Link>

        {/* Desktop Horizontal Navigation (Odoo ERP Theme) */}
        <nav className="hidden items-center lg:flex" aria-label="Primary">
          <Link href="/dashboard" className={cn(navLink, isDashboard && activeNav)}>
            Dashboard
          </Link>

          {/* Operations Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOperationsOpen((o) => !o)}
              onBlur={() => setTimeout(() => setOperationsOpen(false), 200)}
              className={cn(navLink, isOperations && activeNav)}
            >
              <span>Operations</span>
              <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
            </button>
            {operationsOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md z-50 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  href="/operations/receipts"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Receipts
                </Link>
                <Link
                  href="/operations/deliveries"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Deliveries
                </Link>
                <Link
                  href="/stock"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Adjustments
                </Link>
              </div>
            )}
          </div>

          <Link href="/products" className={cn(navLink, isProducts && activeNav)}>
            Products
          </Link>

          <Link href="/stock" className={cn(navLink, isStock && activeNav)}>
            Stock
          </Link>

          <Link href="/move-history" className={cn(navLink, isMoveHistory && activeNav)}>
            Move History
          </Link>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              onBlur={() => setTimeout(() => setSettingsOpen(false), 200)}
              className={cn(navLink, isSettings && activeNav)}
            >
              <span>Settings</span>
              <ChevronDown className="size-3.5 opacity-70" aria-hidden="true" />
            </button>
            {settingsOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md z-50 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  href="/settings?tab=warehouses"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Warehouses
                </Link>
                <Link
                  href="/settings?tab=locations"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Locations
                </Link>
                <Link
                  href="/settings?tab=categories"
                  className="block rounded-sm px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover transition-colors"
                >
                  Categories
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2.5 text-sm text-muted-foreground hover:border-border-strong transition-colors cursor-pointer"
            aria-label="Search (Ctrl+K)"
          >
            <Search className="size-4" />
            <span className="hidden md:inline text-xs">Search…</span>
            <kbd className="hidden rounded-sm border border-border px-1 text-[10px] md:inline font-mono">
              Ctrl K
            </kbd>
          </button>

          {/* User Profile / Menu Pill */}
          <DropdownMenu
            trigger={
              <button
                className="ml-1 flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground border border-border hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer shadow-xs"
                aria-label="Account menu"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>
            }
            items={[
              {
                label: user ? `${user.name} (${activeTenant?.name || 'Workspace'})` : 'Account',
                onClick: () => {},
                disabled: true,
              },
              {
                label: 'User Profile',
                icon: <User className="size-4" />,
                onClick: () => router.push('/profile'),
              },
              ...availableTenants
                .filter((t) => t.tenant.id !== activeTenant?.id)
                .map((t) => ({
                  label: `Switch: ${t.tenant.name}`,
                  icon: <Building2 className="size-4 text-primary" />,
                  onClick: () => switchTenant(t.tenant.id),
                })),
              {
                label: 'Warehouse Settings',
                icon: <Settings className="size-4" />,
                onClick: () => {
                  router.push('/settings');
                },
              },
              {
                label: 'Developer Diagnostics',
                icon: <Terminal className="size-4" />,
                onClick: () => {
                  router.push('/internal/foundation');
                },
              },
              {
                label: 'Sign Out',
                icon: <LogOut className="size-4 text-destructive" />,
                destructive: true,
                onClick: () => logout(),
              },
            ]}
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-surface px-4 py-3 lg:hidden space-y-1 animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/dashboard"
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              isDashboard
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-surface-hover',
            )}
          >
            Dashboard
          </Link>
          <div className="pt-2 pb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Operations
          </div>
          <Link
            href="/operations/receipts"
            className="block rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover pl-6"
          >
            Receipts
          </Link>
          <Link
            href="/operations/deliveries"
            className="block rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-hover pl-6"
          >
            Deliveries
          </Link>
          <Link
            href="/products"
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              isProducts
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-surface-hover',
            )}
          >
            Products
          </Link>
          <Link
            href="/stock"
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              isStock
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-surface-hover',
            )}
          >
            Stock
          </Link>
          <Link
            href="/move-history"
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              isMoveHistory
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-surface-hover',
            )}
          >
            Move History
          </Link>
          <Link
            href="/settings"
            className={cn(
              'block rounded-md px-3 py-2 text-sm font-medium',
              isSettings
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground hover:bg-surface-hover',
            )}
          >
            Settings
          </Link>
        </div>
      )}

      {/* Global Quick Search Modal (Ctrl+K) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search operations, products, references..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground p-1"
              >
                ESC
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="px-2 py-1 font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Navigation
              </div>
              <Link
                href="/dashboard"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-foreground hover:bg-surface-hover"
              >
                <span>Dashboard Overview</span>
                <span className="text-muted-foreground text-[10px]">Jump to page</span>
              </Link>
              <Link
                href="/operations/receipts"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-foreground hover:bg-surface-hover"
              >
                <span>Inbound Receipts (WH/IN)</span>
                <span className="text-muted-foreground text-[10px]">Operations</span>
              </Link>
              <Link
                href="/operations/deliveries"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-foreground hover:bg-surface-hover"
              >
                <span>Outbound Deliveries (WH/OUT)</span>
                <span className="text-muted-foreground text-[10px]">Operations</span>
              </Link>
              <Link
                href="/products"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-foreground hover:bg-surface-hover"
              >
                <span>Products & SKUs</span>
                <span className="text-muted-foreground text-[10px]">Inventory</span>
              </Link>
              <Link
                href="/move-history"
                onClick={() => setIsSearchModalOpen(false)}
                className="flex items-center justify-between rounded-md px-2 py-2 text-foreground hover:bg-surface-hover"
              >
                <span>Stock Move Ledger</span>
                <span className="text-muted-foreground text-[10px]">Audit</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
