'use client';

import * as React from 'react';
import { Card, CardContent, Button, Input, EmptyState } from '@stocksense/ui';
import { Package, Plus, Search, Filter, BarChart3, Layers } from 'lucide-react';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Products & Items
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your master product catalog, SKUs, inventory tracking types, and unit of
            measures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            <span>Create Product</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name, SKU, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Categories</span>
          </Button>
        </div>
      </div>

      {/* Product Management Empty / Planned State */}
      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={<Package className="h-10 w-10 text-primary/60" />}
            title="Product Catalog Integration"
            description="Product and SKU catalog management will be enabled in the next implementation phase. Your inventory database foundation and API architecture are fully prepared."
            action={
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <Button variant="outline" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" />
                  <span>View Product Schema</span>
                </Button>
                <Button size="sm" variant="secondary" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Configure Categories</span>
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
