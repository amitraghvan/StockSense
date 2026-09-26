'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Ban,
  Calendar,
  Warehouse,
  User,
  Package,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Button, Dialog, cn } from '@stocksense/ui';
import { PageHeader, PageBody, StatusBadge } from '../../../../components/erp/common';
import {
  useReceipt,
  useValidateReceipt,
  useCompleteReceipt,
  useCancelReceipt,
} from '../../../../hooks/use-receipts';

export default function ReceiptDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: receipt, isLoading, isError } = useReceipt(id);

  const validateMutation = useValidateReceipt();
  const completeMutation = useCompleteReceipt();
  const cancelMutation = useCancelReceipt();

  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');
  const [actionError, setActionError] = React.useState<string | null>(null);

  const handleValidate = async () => {
    setActionError(null);
    try {
      await validateMutation.mutateAsync(id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (err as Error)?.message ||
        'Failed to validate receipt.';
      setActionError(msg);
    }
  };

  const handleComplete = async () => {
    setActionError(null);
    try {
      await completeMutation.mutateAsync(id);
      setIsCompleteDialogOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (err as Error)?.message ||
        'Failed to complete receipt.';
      setActionError(msg);
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    try {
      await cancelMutation.mutateAsync({ id, reason: cancelReason.trim() || undefined });
      setIsCancelDialogOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (err as Error)?.message ||
        'Failed to cancel receipt.';
      setActionError(msg);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="erp-shell p-8 text-center text-muted-foreground animate-pulse">
        Loading receipt details…
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="erp-shell p-8 text-center text-destructive">
        <h2 className="text-lg font-semibold">Receipt Not Found</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The requested receipt does not exist or belongs to another organization.
        </p>
        <Link href="/operations/receipts" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-1.5" />
            Back to Receipts
          </Button>
        </Link>
      </div>
    );
  }

  const isDraft = receipt.status === 'DRAFT';
  const isReady = receipt.status === 'READY';
  const isDone = receipt.status === 'DONE';
  const isCancelled = receipt.status === 'CANCELLED';

  const lines = receipt.lines || [];
  const totalQuantity = lines.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <>
      {/* Print-specific style overrides */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav,
          aside,
          header,
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <PageHeader
        title={receipt.reference}
        breadcrumb="Operations / Receipts"
        actions={
          <div className="flex items-center gap-2 no-print">
            <Link href="/operations/receipts">
              <Button variant="outline" size="sm" className="h-8">
                <ArrowLeft className="size-4 mr-1.5" />
                Receipts
              </Button>
            </Link>

            {/* Print action */}
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8">
              <Printer className="size-4 mr-1.5" />
              Print
            </Button>

            {/* Validate Action: DRAFT -> READY */}
            {isDraft && (
              <Button
                size="sm"
                onClick={handleValidate}
                disabled={validateMutation.isPending}
                className="h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <CheckCircle className="size-4 mr-1.5" />
                {validateMutation.isPending ? 'Validating…' : 'Validate'}
              </Button>
            )}

            {/* Receive / Complete Action: READY -> DONE */}
            {isReady && (
              <Button
                size="sm"
                onClick={() => setIsCompleteDialogOpen(true)}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <ShieldCheck className="size-4 mr-1.5" />
                Receive Products
              </Button>
            )}

            {/* Cancel Action */}
            {(isDraft || isReady) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelDialogOpen(true)}
                className="h-8 text-destructive hover:bg-destructive/10 hover:border-destructive/40"
              >
                <Ban className="size-4 mr-1.5" />
                Cancel
              </Button>
            )}
          </div>
        }
      >
        {/* Status Pipeline Tracker */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border border-border text-xs">
          <span
            className={cn(
              'px-2.5 py-1 rounded font-medium transition-colors',
              isDraft
                ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                : 'text-muted-foreground',
            )}
          >
            Draft
          </span>
          <span className="text-muted-foreground">→</span>
          <span
            className={cn(
              'px-2.5 py-1 rounded font-medium transition-colors',
              isReady ? 'bg-info/20 text-info font-semibold shadow-xs' : 'text-muted-foreground',
            )}
          >
            Ready
          </span>
          <span className="text-muted-foreground">→</span>
          <span
            className={cn(
              'px-2.5 py-1 rounded font-medium transition-colors',
              isDone
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : isCancelled
                  ? 'bg-destructive/20 text-destructive font-semibold shadow-xs'
                  : 'text-muted-foreground',
            )}
          >
            {isCancelled ? 'Cancelled' : 'Done'}
          </span>
        </div>
      </PageHeader>

      <PageBody>
        <div className="space-y-6 max-w-5xl mx-auto print-area">
          {actionError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 no-print">
              <AlertTriangle className="size-5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Banner for completed receipts */}
          {isDone && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Inventory Successfully Received</h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Stock balances have been updated atomically. {totalQuantity} total units added
                    to warehouse stock.
                  </p>
                </div>
              </div>
              {receipt.completedAt && (
                <span className="text-xs font-mono opacity-80">
                  {new Date(receipt.completedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Banner for cancelled receipts */}
          {isCancelled && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ban className="size-5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Receipt Cancelled</h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    This inbound order was cancelled and no stock was modified.
                  </p>
                </div>
              </div>
              {receipt.cancelledAt && (
                <span className="text-xs font-mono opacity-80">
                  {new Date(receipt.cancelledAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Metadata Card */}
          <div className="erp-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Inbound Shipment Reference
                </span>
                <h1 className="text-2xl font-bold text-foreground mt-0.5">{receipt.reference}</h1>
              </div>
              <StatusBadge status={receipt.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
              {/* Supplier info */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Package className="size-4" />
                  <span>Receive From</span>
                </div>
                <div className="font-semibold text-foreground text-base">
                  {receipt.supplierName}
                </div>
                {receipt.contactPerson && (
                  <div className="text-xs text-muted-foreground">
                    Contact: {receipt.contactPerson}
                  </div>
                )}
              </div>

              {/* Warehouse info */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Warehouse className="size-4" />
                  <span>Destination Warehouse</span>
                </div>
                <div className="font-semibold text-foreground text-base">
                  {receipt.warehouseCode} - {receipt.warehouseName}
                </div>
              </div>

              {/* Schedule Date */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="size-4" />
                  <span>Schedule Date</span>
                </div>
                <div
                  className={cn(
                    'font-semibold text-base',
                    receipt.isLate ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {new Date(receipt.scheduleDate).toLocaleDateString()}
                  {receipt.isLate && (
                    <span className="ml-2 text-xs font-normal text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                      Late
                    </span>
                  )}
                </div>
              </div>

              {/* Responsible User */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <User className="size-4" />
                  <span>Responsible</span>
                </div>
                <div className="font-semibold text-foreground text-base">
                  {receipt.responsibleUserName || 'System Operator'}
                </div>
              </div>
            </div>

            {receipt.notes && (
              <div className="border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground font-medium">Internal Notes:</span>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{receipt.notes}</p>
              </div>
            )}
          </div>

          {/* Product Lines Card */}
          <div className="erp-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Product Lines</h3>
                <p className="text-xs text-muted-foreground">
                  Products and storage locations designated to receive incoming items.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Total Units:</span>{' '}
                <span className="font-mono font-bold text-sm text-foreground">{totalQuantity}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="erp-table w-full">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Destination Location</th>
                    <th className="text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={line.id}>
                      <td className="w-12 text-muted-foreground text-xs">{idx + 1}</td>
                      <td>
                        <div className="font-medium text-foreground">{line.productName}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-muted-foreground">
                          {line.productSku}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted/70 text-foreground">
                          {line.locationShortCode}
                        </span>{' '}
                        <span className="text-xs text-muted-foreground">{line.locationName}</span>
                      </td>
                      <td className="text-right font-mono font-bold text-foreground">
                        {line.quantity}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {line.unitOfMeasure || 'units'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageBody>

      {/* Confirmation Dialog for Receive Products / Complete */}
      <Dialog
        open={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        title="Complete Inbound Receipt?"
        description="Consequential stock mutation confirmation."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={completeMutation.isPending}
              onClick={() => setIsCompleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={completeMutation.isPending}
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {completeMutation.isPending ? 'Processing Stock…' : 'Confirm & Increase Stock'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-sm">
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Consequential Inventory Operation</p>
              <p className="mt-1">
                Completing this receipt will atomically increment inventory balances for{' '}
                <strong>{lines.length} product(s)</strong> totaling{' '}
                <strong>{totalQuantity} units</strong> in warehouse{' '}
                <strong>{receipt.warehouseCode}</strong>.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This action creates permanent stock movement ledger entries and cannot be reversed by
            cancelling.
          </p>
        </div>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="Cancel Inbound Receipt"
        description="Are you sure you want to cancel this receipt?"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Dismiss
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelMutation.isPending}
              onClick={handleCancel}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Receipt'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-sm">
          <p className="text-xs text-muted-foreground">
            Cancelling this receipt will prevent it from ever increasing warehouse inventory.
          </p>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Vendor cancelled shipment or duplicate order"
              className="w-full rounded-md border border-input bg-surface p-2 text-xs text-foreground outline-none focus:border-primary h-20 resize-none"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
