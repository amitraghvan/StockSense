'use client';

import * as React from 'react';
import { Button, Dialog, Input } from '@stocksense/ui';
import { PageHeader, PageBody } from '../../components/erp/common';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  cost: number;
  onHand: number;
}

const initialProducts: ProductItem[] = [
  {
    id: 'p1',
    sku: 'DESK001',
    name: 'Desk',
    cost: 3000,
    onHand: 50,
  },
  {
    id: 'p2',
    sku: 'TABL001',
    name: 'Table',
    cost: 3000,
    onHand: 50,
  },
  {
    id: 'p3',
    sku: 'CHAI001',
    name: 'Office Chair',
    cost: 1800,
    onHand: 12,
  },
  {
    id: 'p4',
    sku: 'SHLF001',
    name: 'Shelf Unit',
    cost: 2200,
    onHand: 0,
  },
];

export default function ProductsPage() {
  const [products, setProducts] = React.useState<ProductItem[]>(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newSku, setNewSku] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newCost, setNewCost] = React.useState('');
  const [newOnHand, setNewOnHand] = React.useState('');

  const handleCreate = () => {
    if (!newName.trim() || !newSku.trim()) return;
    const item: ProductItem = {
      id: `p${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      cost: parseFloat(newCost) || 0,
      onHand: parseInt(newOnHand, 10) || 0,
    };
    setProducts((prev) => [item, ...prev]);
    setIsDialogOpen(false);
    setNewSku('');
    setNewName('');
    setNewCost('');
    setNewOnHand('');
  };

  return (
    <>
      <PageHeader
        title="Products"
        breadcrumb="Inventory"
        actions={
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            New
          </Button>
        }
      />

      <PageBody>
        <div className="erp-panel overflow-x-auto">
          <table className="erp-table min-w-[560px]">
            <thead>
              <tr>
                <th>Internal reference</th>
                <th>Name</th>
                <th className="text-right">Cost</th>
                <th className="text-right">On hand</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-primary font-medium">{p.sku}</td>
                  <td className="font-medium text-foreground">{p.name}</td>
                  <td className="text-right font-mono">₹{p.cost.toLocaleString('en-IN')}</td>
                  <td
                    className={`text-right font-medium ${
                      p.onHand === 0 ? 'text-destructive font-semibold' : 'text-foreground'
                    }`}
                  >
                    {p.onHand}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageBody>

      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="New Product"
        description="Register a new inventory product SKU and define default cost."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Save Product
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input
            label="Internal Reference (SKU)"
            placeholder="e.g. CAB001"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
          />
          <Input
            label="Product Name"
            placeholder="e.g. Filing Cabinet"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Cost (₹)"
              type="number"
              placeholder="e.g. 2500"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
            />
            <Input
              label="Initial On Hand"
              type="number"
              placeholder="e.g. 20"
              value={newOnHand}
              onChange={(e) => setNewOnHand(e.target.value)}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
