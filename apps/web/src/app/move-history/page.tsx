'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { PageHeader, PageBody, StatusBadge, ERPEmptyState } from '../../components/erp/common';

interface MoveRecord {
  id: string;
  ref: string;
  date: string;
  contact: string;
  product: string;
  from: string;
  to: string;
  qty: number;
  status: 'done' | 'waiting' | 'ready' | 'cancelled';
}

const initialMoves: MoveRecord[] = [
  {
    id: 'm1',
    ref: 'WH/IN/0000',
    date: '2026-09-20',
    contact: 'Vendor',
    product: 'Desk',
    from: 'Vendor',
    to: 'WH/Stock1',
    qty: 50,
    status: 'done',
  },
  {
    id: 'm2',
    ref: 'WH/IN/0000',
    date: '2026-09-20',
    contact: 'Vendor',
    product: 'Table',
    from: 'Vendor',
    to: 'WH/Stock1',
    qty: 50,
    status: 'done',
  },
];

export default function MoveHistoryPage() {
  const [q, setQ] = React.useState('');

  const rows = initialMoves.filter(
    (m) =>
      m.ref.toLowerCase().includes(q.toLowerCase()) ||
      m.contact.toLowerCase().includes(q.toLowerCase()) ||
      m.product.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Move History" breadcrumb="Inventory">
        <label className="relative">
          <span className="sr-only">Search by reference or contact</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference or contact…"
            className="h-8 w-64 rounded-md border border-input bg-surface pl-8 pr-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </PageHeader>

      <PageBody>
        <div className="erp-panel overflow-x-auto">
          {rows.length === 0 ? (
            <ERPEmptyState
              title="No moves yet"
              description="Validated receipts, deliveries and adjustments appear here."
            />
          ) : (
            <table className="erp-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Contact</th>
                  <th>Product</th>
                  <th>From</th>
                  <th>To</th>
                  <th className="text-right">Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-foreground">{m.ref}</td>
                    <td className="text-muted-foreground text-xs">{m.date}</td>
                    <td>{m.contact}</td>
                    <td className="font-medium">{m.product}</td>
                    <td className="text-muted-foreground text-xs">{m.from}</td>
                    <td className="text-muted-foreground text-xs">{m.to}</td>
                    <td className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      +{m.qty}
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </PageBody>
    </>
  );
}
