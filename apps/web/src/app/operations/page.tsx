'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { PageHeader, PageBody } from '../../components/erp/common';

const operationsHubItems = [
  {
    title: 'Receipts',
    description: 'Incoming stock shipments and purchases from suppliers.',
    href: '/operations/receipts',
    icon: ArrowDownToLine,
    badge: 'Inbound',
    count: '1 to receive',
  },
  {
    title: 'Deliveries',
    description: 'Outgoing stock shipments and customer dispatches.',
    href: '/operations/deliveries',
    icon: ArrowUpFromLine,
    badge: 'Outbound',
    count: '1 to deliver',
  },
  {
    title: 'Physical Adjustments',
    description: 'Reconcile counted stock with on-hand balances.',
    href: '/stock',
    icon: SlidersHorizontal,
    badge: 'Audit',
    count: '4 active SKUs',
  },
  {
    title: 'Internal Transfers',
    description: 'Move inventory between warehouses and locations.',
    href: '/move-history',
    icon: ArrowLeftRight,
    badge: 'Internal',
    count: '2 moves recorded',
  },
];

export default function OperationsHubPage() {
  return (
    <>
      <PageHeader title="Operations Hub" breadcrumb="Inventory" />

      <PageBody>
        <div className="grid gap-4 md:grid-cols-2">
          {operationsHubItems.map((op) => {
            const Icon = op.icon;
            return (
              <Link key={op.title} href={op.href} className="block group">
                <div className="erp-panel p-5 hover:border-primary/50 transition-all hover:shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground group-hover:scale-105 transition-transform">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {op.title}
                        </h2>
                        <span className="text-xs text-muted-foreground">{op.badge}</span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                    {op.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>{op.count}</span>
                    <span className="font-medium text-primary">Open →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </PageBody>
    </>
  );
}
