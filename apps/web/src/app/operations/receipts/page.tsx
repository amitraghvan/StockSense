'use client';

import * as React from 'react';
import { LayoutGrid, List, Search } from 'lucide-react';
import { Button, Dialog, Input, cn } from '@stocksense/ui';
import { PageHeader, PageBody, StatusBadge } from '../../../components/erp/common';

interface OperationItem {
  id: string;
  ref: string;
  from: string;
  to: string;
  contact: string;
  scheduleDate: string;
  isLate: boolean;
  status: 'draft' | 'waiting' | 'ready' | 'done' | 'cancelled';
}

const initialReceipts: OperationItem[] = [
  {
    id: 'o1',
    ref: 'WH/IN/0001',
    contact: 'Azure Interior',
    from: 'Vendor',
    to: 'WH/Stock1',
    scheduleDate: '2026-09-24',
    isLate: true,
    status: 'ready',
  },
  {
    id: 'o2',
    ref: 'WH/IN/0002',
    contact: 'Azure Interior',
    from: 'Vendor',
    to: 'WH/Stock1',
    scheduleDate: '2026-09-29',
    isLate: false,
    status: 'draft',
  },
];

export default function ReceiptsPage() {
  const [receipts, setReceipts] = React.useState<OperationItem[]>(initialReceipts);
  const [view, setView] = React.useState<'list' | 'kanban'>('list');
  const [q, setQ] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newVendor, setNewVendor] = React.useState('');
  const [newContact, setNewContact] = React.useState('');
  const [newDate, setNewDate] = React.useState('2026-09-30');

  const filtered = receipts.filter(
    (o) =>
      o.ref.toLowerCase().includes(q.toLowerCase()) ||
      o.contact.toLowerCase().includes(q.toLowerCase()),
  );

  const handleCreate = () => {
    if (!newContact.trim()) return;
    const newRef = `WH/IN/000${receipts.length + 1}`;
    const newOp: OperationItem = {
      id: `o${Date.now()}`,
      ref: newRef,
      contact: newContact.trim(),
      from: newVendor.trim() || 'Vendor',
      to: 'WH/Stock1',
      scheduleDate: newDate,
      isLate: false,
      status: 'draft',
    };
    setReceipts((prev) => [newOp, ...prev]);
    setIsDialogOpen(false);
    setNewVendor('');
    setNewContact('');
  };

  const kanbanCols: ('draft' | 'ready' | 'done' | 'cancelled')[] = [
    'draft',
    'ready',
    'done',
    'cancelled',
  ];

  return (
    <>
      <PageHeader
        title="Receipts"
        breadcrumb="Operations"
        actions={
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            New
          </Button>
        }
      >
        <label className="relative">
          <span className="sr-only">Search reference or contact</span>
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference or contact…"
            className="h-8 w-60 rounded-md border border-input bg-surface pl-8 pr-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <div
          className="flex rounded-md border border-input bg-surface"
          role="group"
          aria-label="View"
        >
          <button
            onClick={() => setView('list')}
            aria-label="List view"
            className={cn(
              'flex size-8 items-center justify-center text-muted-foreground transition-colors first:rounded-l-md last:rounded-r-md hover:bg-surface-hover',
              view === 'list' && 'bg-accent text-accent-foreground font-semibold',
            )}
          >
            <List className="size-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            aria-label="Kanban view"
            className={cn(
              'flex size-8 items-center justify-center text-muted-foreground transition-colors first:rounded-l-md last:rounded-r-md hover:bg-surface-hover',
              view === 'kanban' && 'bg-accent text-accent-foreground font-semibold',
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </PageHeader>

      <PageBody>
        {view === 'list' ? (
          <div className="erp-panel overflow-x-auto">
            <table className="erp-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Contact</th>
                  <th>Schedule date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.ref}>
                    <td>
                      <span className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                        {o.ref}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">{o.from}</td>
                    <td className="text-muted-foreground text-xs">{o.to}</td>
                    <td>{o.contact}</td>
                    <td
                      className={
                        o.isLate ? 'font-medium text-destructive' : 'text-muted-foreground'
                      }
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
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanCols.map((col) => {
              const colItems = filtered.filter((i) => i.status === col);
              return (
                <div key={col} className="erp-panel p-3 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col}
                    </span>
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {colItems.length}
                    </span>
                  </div>
                  {colItems.length === 0 ? (
                    <div className="rounded border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.ref}
                        className="erp-panel p-3 shadow-xs space-y-2 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-primary">{item.ref}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="text-xs font-medium text-foreground">{item.contact}</div>
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                          <span>{item.to}</span>
                          <span className={item.isLate ? 'text-destructive font-medium' : ''}>
                            {item.scheduleDate}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageBody>

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="New Inbound Receipt"
        description="Draft incoming stock shipment from vendor to warehouse destination."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Save Draft
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input
            label="Vendor / Supplier"
            placeholder="e.g. Azure Interior"
            value={newVendor}
            onChange={(e) => setNewVendor(e.target.value)}
          />
          <Input
            label="Contact Person"
            placeholder="e.g. Jane Doe"
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
          />
          <Input
            label="Schedule Date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  );
}
