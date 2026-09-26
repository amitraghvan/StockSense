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
import { Plus, Search, LayoutList, Kanban, ArrowUpRight, ChevronLeft } from 'lucide-react';

interface DeliveryItem {
  reference: string;
  from: string;
  to: string;
  contact: string;
  scheduleDate: string;
  responsible: string;
  operationType: string;
  status: 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Cancelled';
}

export default function DeliveriesPage() {
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Phase 01 Empty State list
  const deliveries: DeliveryItem[] = [];

  const filteredDeliveries = deliveries.filter((item) => {
    const matchesSearch =
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.to.toLowerCase().includes(searchQuery.toLowerCase());
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
            <span className="text-foreground font-medium">Deliveries</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Delivery Orders</h2>
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
            <span>New Delivery Order</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reference, customer, destination..."
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
            <option value="Ready">Ready to Dispatch</option>
            <option value="Done">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'list' ? (
        filteredDeliveries.length === 0 ? (
          <EmptyState
            icon={<ArrowUpRight className="h-8 w-8 text-muted-foreground" />}
            title="No Delivery Orders Found"
            description="There are currently no customer delivery orders queued for picking or dispatch. Use the New Delivery Order button to schedule one."
            action={
              <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Create First Delivery</span>
              </Button>
            }
          />
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Source Location</TableHead>
                  <TableHead>Destination / Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Operation Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.reference}>
                    <TableCell className="font-semibold text-primary">
                      {delivery.reference}
                    </TableCell>
                    <TableCell>{delivery.from}</TableCell>
                    <TableCell>{delivery.to}</TableCell>
                    <TableCell>{delivery.contact}</TableCell>
                    <TableCell>{delivery.scheduleDate}</TableCell>
                    <TableCell>{delivery.responsible}</TableCell>
                    <TableCell>{delivery.operationType}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{delivery.status}</Badge>
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
                No deliveries in {col}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Delivery Dialog (from Wireframe) */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Outgoing Delivery Order"
        description="Schedule a new customer delivery order for warehouse picking and dispatch."
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
            <Input label="Customer / Destination" placeholder="e.g. Apex Global Logistics" />
            <Input label="Contact Person" placeholder="e.g. Robert Vance" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Source Location" defaultValue="WH/Stock" />
            <Input
              label="Scheduled Date"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Operation Type</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
                <option>Standard Delivery Order</option>
                <option>Express Shipping</option>
                <option>Direct Customer Pickup</option>
              </select>
            </div>
            <Input label="Responsible" defaultValue="Admin User" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
