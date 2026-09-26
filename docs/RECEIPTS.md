# StockSense Receipts & Incoming Inventory Operations

## 1. Domain Concept & Overview

A **Receipt** represents incoming inventory entering a warehouse facility from an external supplier or vendor.

The lifecycle follows the canonical warehouse operations flow:

```
           [ Create ]
               ↓
           +-------+
           | DRAFT | ──────────┐
           +-------+           │
               │               │
        validateReceipt()      │
               ↓               │
           +-------+           │
           | READY | ────┐     │ cancelReceipt()
           +-------+     │     │
               │         │     │
        completeReceipt()│     │
               ↓         │     │
           +-------+     │     │
           | DONE  |     ▼     ▼
           +-------+  +-----------+
                      | CANCELLED |
                      +-----------+
```

### Critical Inventory Rules

1. **`DRAFT`**: Draft receipts represent intent. They **DO NOT** affect physical stock balances.
2. **`READY`**: Ready receipts represent scheduled/staged incoming shipments. They **DO NOT** affect physical stock balances.
3. **`DONE`**: Receipt completion triggers an **ATOMIC, TRANSACTIONAL INCREMENT** of `InventoryBalance.quantityOnHand` across all line items and destinations.
4. **`CANCELLED`**: Cancelled receipts cannot be completed or re-activated. Receipts already marked `DONE` can **NEVER** be cancelled because physical stock has already entered inventory.

---

## 2. Concurrency-Safe Sequential Reference Generator

StockSense requires sequential, human-friendly references formatted as:

```
WH/IN/0001
WH/IN/0002
WH/IN/0042
```

### Strategy

- References are generated exclusively on the backend within an atomic database transaction.
- We avoid `MAX(reference) + 1` queries to eliminate race conditions under high concurrency.
- The `ReceiptSequence` table maintains atomic sequence counters scoped by `(tenantId, prefix)`:

```sql
CREATE TABLE "receipt_sequences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenant_id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "receipt_sequences_tenant_id_prefix_key" UNIQUE ("tenant_id", "prefix")
);
```

- In PostgreSQL, executing:

```ts
const seq = await tx.receiptSequence.upsert({
  where: { tenantId_prefix: { tenantId, prefix } },
  update: { lastValue: { increment: 1 } },
  create: { tenantId, prefix, lastValue: 1 },
});
```

guarantees atomic row-level increment with zero duplicate reference collisions even during parallel requests.

---

## 3. Atomic Inventory Balance & Stock Ledger Foundation

When a receipt transitions `READY` → `DONE`:

1. The transaction acquires and verifies the receipt status.
2. For each product line in the receipt, an upsert is performed on `InventoryBalance`:

```ts
await tx.inventoryBalance.upsert({
  where: {
    productId_locationId: {
      productId: line.productId,
      locationId: line.locationId,
    },
  },
  update: {
    quantityOnHand: { increment: line.quantity },
  },
  create: {
    tenantId,
    productId: line.productId,
    locationId: line.locationId,
    quantityOnHand: line.quantity,
  },
});
```

3. An immutable `StockMovement` ledger entry is appended:

```ts
await tx.stockMovement.create({
  data: {
    tenantId,
    receiptId: receipt.id,
    productId: line.productId,
    locationId: line.locationId,
    quantity: line.quantity,
    movementType: 'RECEIPT',
    reference: receipt.reference,
    performedBy: userId,
  },
});
```

4. The receipt status is updated to `DONE` with `completedAt = new Date()`.
5. An audit event `RECEIPT_COMPLETED` is recorded.
6. The entire sequence commits in a single transaction. If any step fails, the entire transaction is rolled back, preserving database integrity.

---

## 4. Idempotency & Concurrency Safety

If duplicate `POST /api/v1/receipts/:id/complete` requests are submitted concurrently or sequentially:

- If `receipt.status === 'DONE'`, the service immediately exits the mutation block and returns the existing receipt record without incrementing stock balances or creating duplicate ledger entries.
- In race condition tests with simultaneous requests, exactly one request commits the state change and stock increment, while concurrent requests safely receive the completed state.

---

## 5. Warehouse & Location Consistency Rules

Every line in a receipt specifies a product, quantity, and destination location:

- Destination locations must belong to the active tenant.
- Destination locations must belong to the receipt's selected warehouse. Submissions attempting to route lines to a location in a different warehouse are rejected with HTTP 400 Bad Request.
- Inactive products and inactive locations are strictly rejected.

---

## 6. Permissions & RBAC

| Operation                | Permission Required | Roles Allowed                                                       |
| ------------------------ | ------------------- | ------------------------------------------------------------------- |
| View Receipts / Search   | `receipt:view`      | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF, OPERATIONS_LEAD, AUDITOR |
| Create Draft Receipt     | `receipt:create`    | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF, OPERATIONS_LEAD          |
| Update Draft Receipt     | `receipt:create`    | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF, OPERATIONS_LEAD          |
| Validate (DRAFT → READY) | `receipt:validate`  | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF                           |
| Complete (READY → DONE)  | `receipt:validate`  | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF                           |
| Cancel Receipt           | `receipt:validate`  | ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF                           |

---

## 7. Frontend User Experience

The frontend implementation strictly adheres to the Excalidraw / Odoo ERP layout:

- **Receipts List (`/operations/receipts`)**:
  - List View with Reference, Supplier / Contact, Destination Warehouse, Lines count, Schedule date, and Status badges.
  - Kanban View with columns for `DRAFT`, `READY`, `DONE`, and `CANCELLED`.
  - Search by reference and supplier.
  - Filters by Status and Warehouse.
  - Server-side pagination.
  - "New" modal dialog supporting multi-product line entry with dynamic warehouse-scoped location filtering.
- **Receipt Detail Page (`/operations/receipts/[id]`)**:
  - Real-time status pipeline tracker (`Draft` → `Ready` → `Done` / `Cancelled`).
  - Action buttons based on lifecycle state (Validate, Receive Products, Print, Cancel).
  - Consequential stock operation confirmation modal before completing.
  - Product line items breakdown.
  - High-fidelity print styles optimized for warehouse delivery dockets (`@media print`).
