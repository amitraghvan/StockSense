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
  Card,
  CardContent,
  EmptyState,
} from '@stocksense/ui';
import {
  History,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface StockMoveRecord {
  id: string;
  reference: string;
  date: string;
  product: string;
  contact: string;
  from: string;
  to: string;
  quantity: string;
  status: 'Done' | 'Waiting' | 'Ready' | 'Cancelled';
}

export default function MoveHistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [typeFilter, setTypeFilter] = React.useState('ALL');

  // In Phase 01: strict boundary — no fake data, authentic empty state shell
  const movements: StockMoveRecord[] = [];

  const filteredMovements = movements.filter((move) => {
    const matchesSearch =
      move.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      move.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      move.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || move.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Stock Move History
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete audit ledger of all physical inventory movements, stock receipts, shipments,
            and internal transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="gap-2 text-xs" disabled>
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs" disabled>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Print Ledger</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reference, contact, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Operations</option>
            <option value="IN">Inbound Receipts (WH/IN)</option>
            <option value="OUT">Outbound Deliveries (WH/OUT)</option>
            <option value="INT">Internal Transfers (WH/INT)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="Done">Done</option>
            <option value="Waiting">Waiting</option>
            <option value="Ready">Ready</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Move History Ledger Table */}
      {filteredMovements.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <EmptyState
              icon={<History className="h-10 w-10 text-muted-foreground" />}
              title="No Stock Movements Recorded"
              description="The stock move ledger tracks every inventory transaction once receipts, deliveries, or internal transfers are validated. No movements have occurred yet."
              action={
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href="/operations/receipts">
                    <Button size="sm" variant="outline" className="gap-2">
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                      <span>Process Inbound Receipt</span>
                    </Button>
                  </Link>
                  <Link href="/operations/deliveries">
                    <Button size="sm" className="gap-2">
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      <span>Process Delivery Order</span>
                    </Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>From (Source)</TableHead>
                <TableHead>To (Destination)</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((move) => (
                <TableRow key={move.id}>
                  <TableCell className="font-semibold text-primary font-mono text-xs">
                    {move.reference}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{move.date}</TableCell>
                  <TableCell className="font-medium text-foreground">{move.product}</TableCell>
                  <TableCell>{move.contact}</TableCell>
                  <TableCell className="text-xs font-mono">{move.from}</TableCell>
                  <TableCell className="text-xs font-mono">{move.to}</TableCell>
                  <TableCell className="text-right font-medium">{move.quantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        move.status === 'Done'
                          ? 'success'
                          : move.status === 'Waiting'
                            ? 'warning'
                            : move.status === 'Ready'
                              ? 'default'
                              : 'destructive'
                      }
                      className="text-xs"
                    >
                      {move.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
