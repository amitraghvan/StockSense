'use client';

import * as React from 'react';
import { Button, Dialog, Input, Badge, Skeleton, EmptyState } from '@stocksense/ui';
import { PageHeader, PageBody } from '../../components/erp/common';
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
} from '../../hooks/use-inventory';
import { ProductSummary, UnitOfMeasureType, UOM_DISPLAY_NAMES } from '@stocksense/types';
import { UnitOfMeasureValues } from '@stocksense/validation';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Package,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function ProductsPage() {
  // Query & Filter states
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [page, setPage] = React.useState(1);
  const limit = 10;

  // React Query hooks
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProducts({
    page,
    limit,
    search: search.trim() || undefined,
    categoryId: selectedCategory || undefined,
    status: statusFilter || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data: categoriesData } = useCategories({ status: 'ACTIVE' });
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createSku, setCreateSku] = React.useState('');
  const [createName, setCreateName] = React.useState('');
  const [createDesc, setCreateDesc] = React.useState('');
  const [createCategory, setCreateCategory] = React.useState('');
  const [createUom, setCreateUom] = React.useState<UnitOfMeasureType>('PCS');
  const [createCost, setCreateCost] = React.useState('');
  const [createSale, setCreateSale] = React.useState('');
  const [createReorderLevel, setCreateReorderLevel] = React.useState('10');
  const [createReorderQty, setCreateReorderQty] = React.useState('25');
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Edit Modal state
  const [editingProduct, setEditingProduct] = React.useState<ProductSummary | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDesc, setEditDesc] = React.useState('');
  const [editCategory, setEditCategory] = React.useState('');
  const [editUom, setEditUom] = React.useState<UnitOfMeasureType>('PCS');
  const [editCost, setEditCost] = React.useState('');
  const [editSale, setEditSale] = React.useState('');
  const [editReorderLevel, setEditReorderLevel] = React.useState('');
  const [editReorderQty, setEditReorderQty] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editError, setEditError] = React.useState<string | null>(null);

  const openCreateModal = () => {
    setCreateSku('');
    setCreateName('');
    setCreateDesc('');
    setCreateCategory(categoriesData?.items?.[0]?.id || '');
    setCreateUom('PCS');
    setCreateCost('');
    setCreateSale('');
    setCreateReorderLevel('10');
    setCreateReorderQty('25');
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (product: ProductSummary) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDesc(product.description || '');
    setEditCategory(product.categoryId || '');
    setEditUom(product.unitOfMeasure);
    setEditCost(product.costPrice !== null ? String(product.costPrice) : '');
    setEditSale(product.salePrice !== null ? String(product.salePrice) : '');
    setEditReorderLevel(product.reorderLevel !== null ? String(product.reorderLevel) : '');
    setEditReorderQty(product.reorderQty !== null ? String(product.reorderQty) : '');
    setEditStatus(product.status);
    setEditError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createSku.trim()) {
      setCreateError('Internal Reference (SKU) is required.');
      return;
    }
    if (!createName.trim()) {
      setCreateError('Product Name is required.');
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        sku: createSku.trim().toUpperCase(),
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        categoryId: createCategory || undefined,
        unitOfMeasure: createUom,
        costPrice: createCost ? parseFloat(createCost) : undefined,
        salePrice: createSale ? parseFloat(createSale) : undefined,
        reorderLevel: createReorderLevel ? parseInt(createReorderLevel, 10) : undefined,
        reorderQty: createReorderQty ? parseInt(createReorderQty, 10) : undefined,
      });
      setIsCreateOpen(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to register product.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Product Name is required.');
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        data: {
          name: editName.trim(),
          description: editDesc.trim() || null,
          categoryId: editCategory || null,
          unitOfMeasure: editUom,
          costPrice: editCost ? parseFloat(editCost) : null,
          salePrice: editSale ? parseFloat(editSale) : null,
          reorderLevel: editReorderLevel ? parseInt(editReorderLevel, 10) : null,
          reorderQty: editReorderQty ? parseInt(editReorderQty, 10) : null,
          status: editStatus,
        },
      });
      setEditingProduct(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update product.');
    }
  };

  const handleToggleStatus = async (product: ProductSummary) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        data: { status: nextStatus },
      });
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const items = productsData?.items || [];
  const pagination = productsData?.pagination;

  return (
    <>
      <PageHeader
        title="Products"
        breadcrumb="Inventory Master Data"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              <span>New Product</span>
            </Button>
          </div>
        }
      />

      <PageBody>
        {/* Filter & Search Bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg shadow-2xs">
          <div className="flex flex-1 items-center gap-2 max-w-md relative">
            <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Filter className="size-3" /> Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Categories</option>
                {categoriesData?.items?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | '');
                  setPage(1);
                }}
                className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Archived / Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="erp-panel overflow-hidden border border-border rounded-lg bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="erp-table min-w-[850px] w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-3">SKU / Ref</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">UOM</th>
                  <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                  <th className="py-2.5 px-3 text-right">Sale Price (₹)</th>
                  <th className="py-2.5 px-3 text-center">Reorder (Min/Batch)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-3">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="p-3 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                      <td className="p-3 text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-4 w-16 mx-auto" />
                      </td>
                      <td className="p-3 text-center">
                        <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                      </td>
                      <td className="p-3 text-right">
                        <Skeleton className="h-7 w-14 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-destructive">
                      <AlertCircle className="size-8 mx-auto mb-2 text-destructive" />
                      <p className="font-semibold">Failed to load product catalog.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {error instanceof Error ? error.message : 'Unknown network error.'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetch()}
                        className="mt-3"
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12">
                      <EmptyState
                        icon={<Package className="size-10 text-muted-foreground" />}
                        title="No products found"
                        description={
                          search || selectedCategory || statusFilter
                            ? 'No products matched your search or filter criteria.'
                            : 'No inventory products registered yet. Click "New Product" to get started.'
                        }
                        action={
                          !search && !selectedCategory && !statusFilter ? (
                            <Button size="sm" onClick={openCreateModal} className="mt-2">
                              Create First Product
                            </Button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => openEditModal(p)}
                    >
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                        {p.sku}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {p.categoryName ? (
                          <span className="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {p.categoryName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">
                        {p.unitOfMeasure}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-medium">
                        {p.costPrice !== null ? `₹${p.costPrice.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-foreground">
                        {p.salePrice !== null ? `₹${p.salePrice.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs font-mono text-muted-foreground">
                        {p.reorderLevel ?? '—'} / {p.reorderQty ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title={`Click to ${p.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                          className="cursor-pointer"
                        >
                          <Badge
                            variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={`text-[11px] font-semibold tracking-wider ${
                              p.status === 'ACTIVE'
                                ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/25'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(p)}
                            className="size-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit Product"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-card">
              <span className="text-xs text-muted-foreground">
                Showing {items.length} of {pagination.total} product
                {pagination.total !== 1 ? 's' : ''} (Page {pagination.page} of{' '}
                {pagination.totalPages})
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="size-3 mr-0.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2 text-xs"
                >
                  Next <ChevronRight className="size-3 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageBody>

      {/* New Product Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Register New Product"
        description="Add a new catalog SKU with unit pricing and reorder parameters."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              form="create-product-form"
              disabled={createProductMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createProductMutation.isPending ? 'Registering...' : 'Save Product'}
            </Button>
          </div>
        }
      >
        <form
          id="create-product-form"
          onSubmit={handleCreateSubmit}
          className="space-y-3.5 py-1 text-sm"
        >
          {createError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Internal Reference (SKU) <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. SENS-X100"
                value={createSku}
                onChange={(e) => setCreateSku(e.target.value.toUpperCase())}
                required
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Letters, numbers, dashes, underscores
              </span>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Product Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Industrial Sensor X-100"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Category</label>
              <select
                value={createCategory}
                onChange={(e) => setCreateCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No Category</option>
                {categoriesData?.items?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Unit of Measure (UOM)
              </label>
              <select
                value={createUom}
                onChange={(e) => setCreateUom(e.target.value as UnitOfMeasureType)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {UnitOfMeasureValues.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom} — {UOM_DISPLAY_NAMES[uom]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Cost Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 45.00"
                value={createCost}
                onChange={(e) => setCreateCost(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Sale Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 89.99"
                value={createSale}
                onChange={(e) => setCreateSale(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Reorder Level (Min Stock)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="10"
                value={createReorderLevel}
                onChange={(e) => setCreateReorderLevel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Reorder Batch Qty
              </label>
              <Input
                type="number"
                min="1"
                placeholder="25"
                value={createReorderQty}
                onChange={(e) => setCreateReorderQty(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Technical specifications, packaging notes, storage guidelines..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </form>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        title={`Edit Product — ${editingProduct?.sku}`}
        description="Update master product details and reorder thresholds."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingProduct(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              form="edit-product-form"
              disabled={updateProductMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateProductMutation.isPending ? 'Saving...' : 'Update Product'}
            </Button>
          </div>
        }
      >
        <form
          id="edit-product-form"
          onSubmit={handleEditSubmit}
          className="space-y-3.5 py-1 text-sm"
        >
          {editError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Product Name <span className="text-destructive">*</span>
            </label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No Category</option>
                {categoriesData?.items?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Unit of Measure (UOM)
              </label>
              <select
                value={editUom}
                onChange={(e) => setEditUom(e.target.value as UnitOfMeasureType)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {UnitOfMeasureValues.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom} — {UOM_DISPLAY_NAMES[uom]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Cost Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editCost}
                onChange={(e) => setEditCost(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Sale Price (₹)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editSale}
                onChange={(e) => setEditSale(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Reorder Level
              </label>
              <Input
                type="number"
                min="0"
                value={editReorderLevel}
                onChange={(e) => setEditReorderLevel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Reorder Batch
              </label>
              <Input
                type="number"
                min="1"
                value={editReorderQty}
                onChange={(e) => setEditReorderQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Catalog Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}
