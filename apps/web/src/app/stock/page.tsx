'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { PageHeader, PageBody } from '../../components/erp/common';

interface StockRow {
  id: string;
  sku: string;
  name: string;
  cost: number;
  onHand: number;
  freeToUse: number;
}

const stockData: StockRow[] = [
  {
    id: 'p1',
    sku: 'DESK001',
    name: 'Desk',
    cost: 3000,
    onHand: 50,
    freeToUse: 45,
  },
  {
    id: 'p2',
    sku: 'TABL001',
    name: 'Table',
    cost: 3000,
    onHand: 50,
    freeToUse: 50,
  },
  {
    id: 'p3',
    sku: 'CHAI001',
    name: 'Office Chair',
    cost: 1800,
    onHand: 12,
    freeToUse: 6,
  },
  {
    id: 'p4',
    sku: 'SHLF001',
    name: 'Shelf Unit',
    cost: 2200,
    onHand: 0,
    freeToUse: 0,
  },
];

export default function StockPage() {
  const [query, setQuery] = React.useState('');

  const filtered = stockData.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.sku.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Stock" breadcrumb="Inventory">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-8 w-60 rounded-md border border-input bg-surface pl-8 pr-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      </PageHeader>

      <PageBody>
        <div className="erp-panel overflow-x-auto">
          <table className="erp-table min-w-[640px]">
            <thead>
              <tr>
                <th>Product</th>
                <th>Internal Reference</th>
                <th className="text-right">Unit Cost</th>
                <th className="text-right">On Hand</th>
                <th className="text-right">Free to Use</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-foreground">{item.name}</td>
                  <td className="text-muted-foreground font-mono text-xs">{item.sku}</td>
                  <td className="text-right font-mono">₹{item.cost.toLocaleString('en-IN')}</td>
                  <td
                    className={`text-right font-medium ${
                      item.onHand === 0 ? 'text-destructive font-semibold' : 'text-foreground'
                    }`}
                  >
                    {item.onHand}
                  </td>
                  <td className="text-right text-muted-foreground">{item.freeToUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageBody>
    </>
  );
}
