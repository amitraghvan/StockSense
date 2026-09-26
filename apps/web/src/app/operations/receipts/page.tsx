'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Badge,
  Input,
  Dialog,
  EmptyState,
} from '@stocksense/ui';
import { Plus, Search, LayoutList, Kanban, ArrowDownLeft, ChevronLeft } from 'lucide-react';

interface ReceiptItem {
  reference: string;
  receiveFrom: string;
  to: string;
  contact: string;
  scheduleDate: string;
  responsible: string;
  status: 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Cancelled';
  productsCount: number;
}

export default function ReceiptsPage() {
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Phase 01 Empty State list
  const receipts: ReceiptItem[] = [];

  const filteredReceipts = receipts.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiveFrom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/operations"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Operations</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Receipts</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Incoming Receipts</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Kanban View"
            >
              <Kanban className="h-4 w-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Receipt</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reference, vendor, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Waiting">Waiting Another Operation</option>
            <option value="Ready">Ready</option>
            <option value="Done">Done</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        filteredReceipts.length === 0 ? (
          <EmptyState
            icon={<ArrowDownLeft className="h-8 w-8 text-muted-foreground" />}
            title="No Receipts Found"
            description="There are currently no inbound warehouse receipts recorded in the system. Use the New Receipt button to prepare an incoming delivery."
            action={
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create First Receipt</span>
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Receive From</TableHead>
                  <TableHead>Destination Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.reference}>
                    <TableCell className="font-semibold text-primary">
                      {receipt.reference}
                    </TableCell>
                    <TableCell>{receipt.receiveFrom}</TableCell>
                    <TableCell>{receipt.to}</TableCell>
                    <TableCell>{receipt.contact}</TableCell>
                    <TableCell>{receipt.scheduleDate}</TableCell>
                    <TableCell>{receipt.responsible}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{receipt.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        /* Kanban View Foundation */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Draft', 'Waiting', 'Ready', 'Done'].map((col) => (
            <div key={col} className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  0
                </Badge>
              </div>
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No items in {col}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Receipt UI Dialog Foundation (from Wireframe) */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Inbound Receipt"
        description="Draft a new incoming vendor receipt. Fill in the receiving location and schedule date."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(false)}>
              Save as Draft
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Receive From (Vendor)" placeholder="e.g. Acme Corp Supplies" />
            <Input label="Contact Person" placeholder="e.g. Jane Smith" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Destination Location" defaultValue="WH/Stock" />
            <Input
              label="Scheduled Date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Responsible</label>
            <Input defaultValue="Admin User" />
          </div>

          <div className="p-3 bg-muted/40 rounded-lg border text-xs text-muted-foreground">
            Receipt validation and product stock movements will execute once confirmed in the
            operations pipeline.
          </div>
        </div>
      </Dialog>
    </div>
  );
}
