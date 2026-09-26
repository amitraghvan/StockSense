'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, Search, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Button, Dialog, Input, cn } from '@stocksense/ui';
import { PageHeader, PageBody, StatusBadge } from '../../../components/erp/common';
import { useReceipts, useCreateReceipt } from '../../../hooks/use-receipts';
import { useWarehouses, useProducts, useLocations } from '../../../hooks/use-inventory';
import { ReceiptStatusType } from '@stocksense/types';

interface NewLineDraft {
  productId: string;
  locationId: string;
  quantity: number;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const [view, setView] = React.useState<'list' | 'kanban'>('list');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<ReceiptStatusType | ''>('');
  const [warehouseFilter, setWarehouseFilter] = React.useState<string>('');
  const [page, setPage] = React.useState(1);

  // Queries
  const {
    data: receiptsData,
    isLoading,
    isError,
    refetch,
  } = useReceipts({
    page,
    limit: 20,
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    warehouseId: warehouseFilter || undefined,
  });

  const { data: warehousesData } = useWarehouses({ limit: 100 });
  const { data: productsData } = useProducts({ limit: 100, status: 'ACTIVE' });

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [supplierName, setSupplierName] = React.useState('');
  const [contactPerson, setContactPerson] = React.useState('');
  const [warehouseId, setWarehouseId] = React.useState('');
  const [scheduleDate, setScheduleDate] = React.useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [notes, setNotes] = React.useState('');
  const [lines, setLines] = React.useState<NewLineDraft[]>([
    { productId: '', locationId: '', quantity: 1 },
  ]);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Filter locations by the selected warehouse in modal
  const { data: locationsData } = useLocations({
    warehouseId: warehouseId || undefined,
    limit: 100,
    status: 'ACTIVE',
  });

  // Automatically select first warehouse when data arrives
  React.useEffect(() => {
    if (warehousesData?.items?.length && !warehouseId) {
      setWarehouseId(warehousesData.items[0].id);
    }
  }, [warehousesData, warehouseId]);

  const createReceiptMutation = useCreateReceipt();

  const handleAddLine = () => {
    setLines((prev) => [...prev, { productId: '', locationId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof NewLineDraft, value: string | number) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!supplierName.trim()) {
      setFormError('Supplier / Vendor name is required.');
      return;
    }
    if (!warehouseId) {
      setFormError('Warehouse destination must be selected.');
      return;
    }
    if (lines.length === 0) {
      setFormError('At least one product line is required.');
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.productId) {
        setFormError(`Line #${i + 1} has no product selected.`);
        return;
      }
      if (!line.locationId) {
        setFormError(`Line #${i + 1} has no destination location selected.`);
        return;
      }
      if (!line.quantity || line.quantity <= 0) {
        setFormError(`Line #${i + 1} quantity must be greater than zero.`);
        return;
      }
    }

    try {
      const created = await createReceiptMutation.mutateAsync({
        warehouseId,
        supplierName: supplierName.trim(),
        contactPerson: contactPerson.trim() || undefined,
        scheduleDate: new Date(scheduleDate).toISOString(),
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          productId: l.productId,
          locationId: l.locationId,
          quantity: Number(l.quantity),
        })),
      });

      setIsDialogOpen(false);
      setSupplierName('');
      setContactPerson('');
      setNotes('');
      setLines([{ productId: '', locationId: '', quantity: 1 }]);
      router.push(`/operations/receipts/${created.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (err as Error)?.message ||
        'Failed to create receipt.';
      setFormError(msg);
    }
  };

  const kanbanCols: ReceiptStatusType[] = ['DRAFT', 'READY', 'DONE', 'CANCELLED'];

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
            <Plus className="size-4 mr-1.5" />
            New
          </Button>
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <label className="relative">
            <span className="sr-only">Search reference or contact</span>
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference or supplier…"
              className="h-8 w-56 rounded-md border border-input bg-surface pl-8 pr-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReceiptStatusType | '');
              setPage(1);
            }}
            aria-label="Filter receipts by status"
            className="h-8 text-xs rounded-md border border-input bg-surface px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Warehouse Filter */}
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter receipts by destination warehouse"
            className="h-8 text-xs rounded-md border border-input bg-surface px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Warehouses</option>
            {(warehousesData?.items || []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} - {w.name}
              </option>
            ))}
          </select>

          {/* View Toggle */}
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
        </div>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <div className="erp-panel p-12 text-center text-muted-foreground animate-pulse">
            Loading inbound receipts…
          </div>
        ) : isError ? (
          <div className="erp-panel p-8 text-center text-destructive">
            <AlertCircle className="size-8 mx-auto mb-2 opacity-80" />
            <p className="font-medium">Failed to load receipts.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Try Again
            </Button>
          </div>
        ) : !receiptsData?.items || receiptsData.items.length === 0 ? (
          <div className="erp-panel p-12 text-center">
            <Calendar className="size-10 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No inbound receipts found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Draft incoming product deliveries from vendors to register incoming stock into
              warehouse locations.
            </p>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 bg-primary text-primary-foreground"
            >
              <Plus className="size-4 mr-1.5" />
              Create First Receipt
            </Button>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-4">
            <div className="erp-panel overflow-x-auto">
              <table className="erp-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Supplier / Contact</th>
                    <th>Destination Warehouse</th>
                    <th>Lines</th>
                    <th>Schedule Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptsData.items.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/operations/receipts/${o.id}`)}
                      className="cursor-pointer hover:bg-accent/40 transition-colors"
                    >
                      <td>
                        <Link
                          href={`/operations/receipts/${o.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-primary hover:underline"
                        >
                          {o.reference}
                        </Link>
                      </td>
                      <td>
                        <div className="font-medium text-foreground">{o.supplierName}</div>
                        {o.contactPerson && (
                          <div className="text-xs text-muted-foreground">{o.contactPerson}</div>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/60 text-foreground">
                          {o.warehouseCode}
                        </span>{' '}
                        <span className="text-xs text-muted-foreground">{o.warehouseName}</span>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {o.lines ? `${o.lines.length} items` : '—'}
                      </td>
                      <td
                        className={
                          o.isLate ? 'font-medium text-destructive' : 'text-muted-foreground'
                        }
                      >
                        {new Date(o.scheduleDate).toLocaleDateString()}
                        {o.isLate && (
                          <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-destructive bg-destructive/10 px-1 py-0.5 rounded">
                            Late
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {receiptsData.pagination && receiptsData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <span>
                  Showing {receiptsData.items.length} of {receiptsData.pagination.total} receipts
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page} of {receiptsData.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= receiptsData.pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanCols.map((col) => {
              const colItems = receiptsData.items.filter((i) => i.status === col);
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
                      No {col.toLowerCase()} receipts
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/operations/receipts/${item.id}`)}
                        className="erp-panel p-3 shadow-xs space-y-2 hover:border-primary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-primary">
                            {item.reference}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="text-xs font-medium text-foreground">
                          {item.supplierName}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex justify-between">
                          <span>{item.warehouseCode}</span>
                          <span className={item.isLate ? 'text-destructive font-medium' : ''}>
                            {new Date(item.scheduleDate).toLocaleDateString()}
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

      {/* New Inbound Receipt Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="New Inbound Receipt"
        description="Draft incoming stock shipment from vendor into warehouse storage."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={createReceiptMutation.isPending}
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createReceiptMutation.isPending}
              onClick={handleCreate}
              className="bg-primary text-primary-foreground"
            >
              {createReceiptMutation.isPending ? 'Saving Draft…' : 'Save Draft'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Supplier / Vendor *"
              placeholder="e.g. Azure Interior"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
            <Input
              label="Contact Person"
              placeholder="e.g. Jane Doe"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Destination Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setLines((prev) => prev.map((l) => ({ ...l, locationId: '' })));
                }}
                className="w-full h-9 text-xs rounded-md border border-input bg-surface px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {(warehousesData?.items || []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Schedule Date *"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>

          <Input
            label="Internal Notes"
            placeholder="e.g. Purchase order PO-2026-081"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Product Lines */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Product Lines ({lines.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="h-7 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                Add Product
              </Button>
            </div>

            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center rounded-md border border-border bg-muted/10 p-2 text-xs"
                >
                  <div className="col-span-5">
                    <label className="text-[10px] text-muted-foreground block mb-1">Product</label>
                    <select
                      value={line.productId}
                      onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-input bg-surface px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select product…</option>
                      {(productsData?.items || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-muted-foreground block mb-1">Location</label>
                    <select
                      value={line.locationId}
                      onChange={(e) => handleLineChange(idx, 'locationId', e.target.value)}
                      className="w-full h-8 text-xs rounded-md border border-input bg-surface px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select location…</option>
                      {(locationsData?.items || []).map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.shortCode} - {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground block mb-1">Qty</label>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) =>
                        handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="col-span-1 pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() => handleRemoveLine(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
