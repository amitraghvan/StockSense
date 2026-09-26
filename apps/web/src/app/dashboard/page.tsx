'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@stocksense/ui';
import { PageHeader, PageBody, StatusBadge } from '../../components/erp/common';

export default function DashboardPage() {
  const kpis = [
    {
      label: 'Stock value',
      value: '₹3,39,600',
    },
    {
      label: 'Products',
      value: '4',
    },
    {
      label: 'Out of stock',
      value: '1',
      tone: 'text-destructive',
    },
    {
      label: 'Moves recorded',
      value: '3',
    },
  ];

  const recentOperations = [
    {
      ref: 'WH/OUT/0004',
      contact: '—',
      scheduleDate: '2026-09-26',
      isLate: false,
      status: 'draft',
      link: '/operations/deliveries',
    },
    {
      ref: 'WH/OUT/0003',
      contact: '—',
      scheduleDate: '2026-09-26',
      isLate: false,
      status: 'draft',
      link: '/operations/deliveries',
    },
    {
      ref: 'WH/IN/0001',
      contact: 'Azure Interior',
      scheduleDate: '2026-09-24',
      isLate: false,
      status: 'done',
      link: '/operations/receipts',
    },
    {
      ref: 'WH/IN/0002',
      contact: 'Azure Interior',
      scheduleDate: '2026-09-29',
      isLate: false,
      status: 'draft',
      link: '/operations/receipts',
    },
    {
      ref: 'WH/OUT/0001',
      contact: 'Azure Interior',
      scheduleDate: '2026-09-25',
      isLate: true,
      status: 'ready',
      link: '/operations/deliveries',
    },
    {
      ref: 'WH/OUT/0002',
      contact: 'Deco Addict',
      scheduleDate: '2026-09-28',
      isLate: false,
      status: 'waiting',
      link: '/operations/deliveries',
    },
  ];

  return (
    <>
      <PageHeader title="Dashboard" breadcrumb="Inventory overview" />

      <PageBody className="space-y-5">
        {/* Operations Overview Cards (Receipt & Delivery) */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Inbound Receipt Card */}
          <section className="erp-panel flex flex-col p-5">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Receipt</h2>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <Link href="/operations/receipts">
                <Button className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-xs">
                  0 to receive
                </Button>
              </Link>
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-sm">
                <dt className="text-right font-semibold text-destructive">0</dt>
                <dd className="text-destructive font-medium">Late</dd>
                <dt className="text-right font-semibold text-foreground">1</dt>
                <dd className="text-muted-foreground">Operations</dd>
              </dl>
            </div>
          </section>

          {/* Outbound Delivery Card */}
          <section className="erp-panel flex flex-col p-5">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Delivery</h2>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <Link href="/operations/deliveries">
                <Button className="bg-primary text-primary-foreground font-medium px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-xs">
                  1 to deliver
                </Button>
              </Link>
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-sm">
                <dt className="text-right font-semibold text-destructive">1</dt>
                <dd className="text-destructive font-medium">Late</dd>
                <dt className="text-right font-semibold text-warning">1</dt>
                <dd className="text-warning font-medium">Waiting</dd>
                <dt className="text-right font-semibold text-foreground">1</dt>
                <dd className="text-muted-foreground">Operations</dd>
              </dl>
            </div>
          </section>
        </div>

        {/* 4 Metric KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="erp-panel p-4">
              <div className="text-xs font-medium text-muted-foreground">{k.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${k.tone || 'text-foreground'}`}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Operations Panel */}
        <section className="erp-panel overflow-x-auto">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Recent operations</h2>
            <Link href="/move-history" className="text-sm font-medium text-link hover:underline">
              View move history
            </Link>
          </div>
          <table className="erp-table min-w-[600px]">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Contact</th>
                <th>Schedule date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map((o, idx) => (
                <tr key={`${o.ref}-${idx}`}>
                  <td>
                    <Link
                      href={o.link}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {o.ref}
                    </Link>
                  </td>
                  <td>{o.contact}</td>
                  <td
                    className={o.isLate ? 'font-medium text-destructive' : 'text-muted-foreground'}
                  >
                    {o.scheduleDate}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footnote matching screenshot */}
        <p className="text-xs text-muted-foreground pt-1">
          Late: scheduled date before today · Operations: scheduled after today · Waiting: waiting
          for stock
        </p>
      </PageBody>
    </>
  );
}
