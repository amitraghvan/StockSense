'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@stocksense/ui';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  ChevronRight,
  Boxes,
} from 'lucide-react';

const operationTypes = [
  {
    title: 'Receipts',
    description:
      'Receive goods from vendors, manage incoming shipments, quality checks, and putaway.',
    href: '/operations/receipts',
    badge: 'Inbound',
    badgeVariant: 'success' as const,
    icon: ArrowDownLeft,
    count: '0 to receive',
  },
  {
    title: 'Delivery Orders',
    description: 'Process customer shipments, picking, packing, validation, and outgoing dispatch.',
    href: '/operations/deliveries',
    badge: 'Outbound',
    badgeVariant: 'default' as const,
    icon: ArrowUpRight,
    count: '0 to ship',
  },
  {
    title: 'Internal Transfers',
    description:
      'Move stock between warehouse locations, zones, or across multi-warehouse networks.',
    href: '/operations/receipts', // Future tab
    badge: 'Internal',
    badgeVariant: 'warning' as const,
    icon: ArrowLeftRight,
    count: '0 in transit',
  },
  {
    title: 'Physical Adjustments',
    description:
      'Reconcile on-hand inventory balances after physical cycle counts or scrap identification.',
    href: '/operations/receipts', // Future tab
    badge: 'Audit',
    badgeVariant: 'secondary' as const,
    icon: SlidersHorizontal,
    count: '0 pending',
  },
];

export default function OperationsHubPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Operations Hub
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Central command for all inventory movements, receipts, dispatches, and warehouse
          transfers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {operationTypes.map((op) => {
          const Icon = op.icon;
          return (
            <Link key={op.title} href={op.href} className="block group">
              <Card className="h-full border-border/70 hover:border-primary/50 transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {op.title}
                        </CardTitle>
                        <Badge variant={op.badgeVariant} className="mt-1 text-xs">
                          {op.badge}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardDescription className="pt-2 text-sm leading-relaxed">
                    {op.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Boxes className="h-3.5 w-3.5" />
                      <span>{op.count}</span>
                    </span>
                    <span className="font-medium text-primary">Open Operation →</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
