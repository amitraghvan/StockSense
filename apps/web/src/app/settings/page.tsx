'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Dialog, Input, Badge, Skeleton, EmptyState, cn } from '@stocksense/ui';
import { PageHeader, PageBody } from '../../components/erp/common';
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
} from '../../hooks/use-inventory';
import { WarehouseSummary, LocationSummary, CategorySummary } from '@stocksense/types';
import {
  Building2,
  MapPin,
  Tags,
  Plus,
  Search,
  Filter,
  Edit2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get('tab') as 'warehouses' | 'locations' | 'categories') || 'warehouses';
  const [tab, setTab] = React.useState<'warehouses' | 'locations' | 'categories'>(initialTab);

  React.useEffect(() => {
    const t = searchParams.get('tab') as 'warehouses' | 'locations' | 'categories';
    if (t && ['warehouses', 'locations', 'categories'].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: 'warehouses' | 'locations' | 'categories') => {
    setTab(newTab);
    router.replace(`/settings?tab=${newTab}`);
  };

  // Search states
  const [whSearch, setWhSearch] = React.useState('');
  const [locSearch, setLocSearch] = React.useState('');
  const [catSearch, setCatSearch] = React.useState('');
  const [selectedWarehouseForLocs, setSelectedWarehouseForLocs] = React.useState<string>('');

  // Queries
  const warehousesQuery = useWarehouses({
    search: whSearch.trim() || undefined,
  });

  const locationsQuery = useLocations({
    search: locSearch.trim() || undefined,
    warehouseId: selectedWarehouseForLocs || undefined,
  });

  const categoriesQuery = useCategories({
    search: catSearch.trim() || undefined,
  });

  // Mutations
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();

  // Warehouse Modals State
  const [isWhCreateOpen, setIsWhCreateOpen] = React.useState(false);
  const [whName, setWhName] = React.useState('');
  const [whCode, setWhCode] = React.useState('');
  const [whAddress, setWhAddress] = React.useState('');
  const [whDesc, setWhDesc] = React.useState('');
  const [whError, setWhError] = React.useState<string | null>(null);

  const [editingWh, setEditingWh] = React.useState<WarehouseSummary | null>(null);
  const [editWhName, setEditWhName] = React.useState('');
  const [editWhAddress, setEditWhAddress] = React.useState('');
  const [editWhDesc, setEditWhDesc] = React.useState('');
  const [editWhStatus, setEditWhStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editWhError, setEditWhError] = React.useState<string | null>(null);

  // Location Modals State
  const [isLocCreateOpen, setIsLocCreateOpen] = React.useState(false);
  const [locWhId, setLocWhId] = React.useState('');
  const [locName, setLocName] = React.useState('');
  const [locCode, setLocCode] = React.useState('');
  const [locDesc, setLocDesc] = React.useState('');
  const [locError, setLocError] = React.useState<string | null>(null);

  const [editingLoc, setEditingLoc] = React.useState<LocationSummary | null>(null);
  const [editLocName, setEditLocName] = React.useState('');
  const [editLocDesc, setEditLocDesc] = React.useState('');
  const [editLocStatus, setEditLocStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editLocError, setEditLocError] = React.useState<string | null>(null);

  // Category Modals State
  const [isCatCreateOpen, setIsCatCreateOpen] = React.useState(false);
  const [catName, setCatName] = React.useState('');
  const [catDesc, setCatDesc] = React.useState('');
  const [catError, setCatError] = React.useState<string | null>(null);

  const [editingCat, setEditingCat] = React.useState<CategorySummary | null>(null);
  const [editCatName, setEditCatName] = React.useState('');
  const [editCatDesc, setEditCatDesc] = React.useState('');
  const [editCatStatus, setEditCatStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [editCatError, setEditCatError] = React.useState<string | null>(null);

  // Handlers: Warehouse
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhError(null);
    if (!whName.trim() || !whCode.trim()) {
      setWhError('Warehouse name and code are required.');
      return;
    }
    try {
      await createWarehouseMutation.mutateAsync({
        name: whName.trim(),
        code: whCode.trim().toUpperCase(),
        address: whAddress.trim() || undefined,
        description: whDesc.trim() || undefined,
      });
      setIsWhCreateOpen(false);
      setWhName('');
      setWhCode('');
      setWhAddress('');
      setWhDesc('');
    } catch (err) {
      setWhError(err instanceof Error ? err.message : 'Failed to create warehouse.');
    }
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWh) return;
    setEditWhError(null);
    try {
      await updateWarehouseMutation.mutateAsync({
        id: editingWh.id,
        data: {
          name: editWhName.trim() || undefined,
          address: editWhAddress.trim() || null,
          description: editWhDesc.trim() || null,
          status: editWhStatus,
        },
      });
      setEditingWh(null);
    } catch (err) {
      setEditWhError(err instanceof Error ? err.message : 'Failed to update warehouse.');
    }
  };

  // Handlers: Location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);
    if (!locWhId) {
      setLocError('Please select a warehouse.');
      return;
    }
    if (!locName.trim() || !locCode.trim()) {
      setLocError('Location name and short code are required.');
      return;
    }
    try {
      await createLocationMutation.mutateAsync({
        warehouseId: locWhId,
        name: locName.trim(),
        shortCode: locCode.trim().toUpperCase(),
        description: locDesc.trim() || undefined,
      });
      setIsLocCreateOpen(false);
      setLocName('');
      setLocCode('');
      setLocDesc('');
    } catch (err) {
      setLocError(err instanceof Error ? err.message : 'Failed to create location.');
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;
    setEditLocError(null);
    try {
      await updateLocationMutation.mutateAsync({
        id: editingLoc.id,
        data: {
          name: editLocName.trim() || undefined,
          description: editLocDesc.trim() || null,
          status: editLocStatus,
        },
      });
      setEditingLoc(null);
    } catch (err) {
      setEditLocError(err instanceof Error ? err.message : 'Failed to update location.');
    }
  };

  // Handlers: Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!catName.trim()) {
      setCatError('Category name is required.');
      return;
    }
    try {
      await createCategoryMutation.mutateAsync({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });
      setIsCatCreateOpen(false);
      setCatName('');
      setCatDesc('');
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    setEditCatError(null);
    try {
      await updateCategoryMutation.mutateAsync({
        id: editingCat.id,
        data: {
          name: editCatName.trim() || undefined,
          description: editCatDesc.trim() || null,
          status: editCatStatus,
        },
      });
      setEditingCat(null);
    } catch (err) {
      setEditCatError(err instanceof Error ? err.message : 'Failed to update category.');
    }
  };

  const openNewModal = () => {
    if (tab === 'warehouses') {
      setWhName('');
      setWhCode('');
      setWhAddress('');
      setWhDesc('');
      setWhError(null);
      setIsWhCreateOpen(true);
    } else if (tab === 'locations') {
      setLocWhId(selectedWarehouseForLocs || warehousesQuery.data?.items?.[0]?.id || '');
      setLocName('');
      setLocCode('');
      setLocDesc('');
      setLocError(null);
      setIsLocCreateOpen(true);
    } else {
      setCatName('');
      setCatDesc('');
      setCatError(null);
      setIsCatCreateOpen(true);
    }
  };

  return (
    <>
      <PageHeader
        title={
          tab === 'warehouses'
            ? 'Warehouse Facilities'
            : tab === 'locations'
              ? 'Storage Locations'
              : 'Product Categories'
        }
        breadcrumb="Inventory Master Data"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (tab === 'warehouses') warehousesQuery.refetch();
                else if (tab === 'locations') locationsQuery.refetch();
                else categoriesQuery.refetch();
              }}
              className="gap-1.5 h-8 text-xs font-medium"
            >
              <RefreshCw className="size-3.5" />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={openNewModal}
              className="gap-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              <span>
                {tab === 'warehouses'
                  ? 'New Warehouse'
                  : tab === 'locations'
                    ? 'New Location'
                    : 'New Category'}
              </span>
            </Button>
          </div>
        }
      >
        <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs font-medium">
          <button
            onClick={() => handleTabChange('warehouses')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
              tab === 'warehouses'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Building2 className="size-3.5" />
            <span>Warehouses</span>
            {warehousesQuery.data?.pagination && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                {warehousesQuery.data.pagination.total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('locations')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
              tab === 'locations'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MapPin className="size-3.5" />
            <span>Locations</span>
            {locationsQuery.data?.pagination && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                {locationsQuery.data.pagination.total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer',
              tab === 'categories'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Tags className="size-3.5" />
            <span>Categories</span>
            {categoriesQuery.data?.pagination && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                {categoriesQuery.data.pagination.total}
              </span>
            )}
          </button>
        </div>
      </PageHeader>

      <PageBody>
        {/* ========================================================================= */}
        {/* TAB 1: WAREHOUSES */}
        {/* ========================================================================= */}
        {tab === 'warehouses' && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg shadow-2xs">
              <div className="flex flex-1 items-center gap-2 max-w-md relative">
                <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search warehouses by name or code..."
                  value={whSearch}
                  onChange={(e) => setWhSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="erp-panel overflow-hidden border border-border rounded-lg bg-card shadow-2xs">
              <div className="overflow-x-auto">
                <table className="erp-table min-w-[700px] w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Facility Name</th>
                      <th className="py-2.5 px-3">Address</th>
                      <th className="py-2.5 px-3 text-center">Locations</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {warehousesQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-40" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-48" />
                          </td>
                          <td className="p-3 text-center">
                            <Skeleton className="h-4 w-10 mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                          </td>
                          <td className="p-3 text-right">
                            <Skeleton className="h-7 w-12 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (warehousesQuery.data?.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12">
                          <EmptyState
                            icon={<Building2 className="size-10 text-muted-foreground" />}
                            title="No warehouses found"
                            description="Register your first warehouse facility to configure inventory storage."
                            action={
                              <Button size="sm" onClick={openNewModal} className="mt-2">
                                Create Warehouse
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      (warehousesQuery.data?.items || []).map((w) => (
                        <tr
                          key={w.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => {
                            setEditingWh(w);
                            setEditWhName(w.name);
                            setEditWhAddress(w.address || '');
                            setEditWhDesc(w.description || '');
                            setEditWhStatus(w.status);
                            setEditWhError(null);
                          }}
                        >
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                            {w.code}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground">{w.name}</div>
                            {w.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {w.description}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {w.address || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-xs font-semibold">
                            {w.locationCount ?? 0}
                          </td>
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant={w.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={`text-[11px] font-semibold tracking-wider ${
                                w.status === 'ACTIVE'
                                  ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {w.status}
                            </Badge>
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingWh(w);
                                setEditWhName(w.name);
                                setEditWhAddress(w.address || '');
                                setEditWhDesc(w.description || '');
                                setEditWhStatus(w.status);
                                setEditWhError(null);
                              }}
                              className="size-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LOCATIONS */}
        {/* ========================================================================= */}
        {tab === 'locations' && (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg shadow-2xs">
              <div className="flex flex-1 items-center gap-2 max-w-md relative">
                <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search locations by name or short code..."
                  value={locSearch}
                  onChange={(e) => setLocSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Filter className="size-3" /> Warehouse:
                </span>
                <select
                  value={selectedWarehouseForLocs}
                  onChange={(e) => setSelectedWarehouseForLocs(e.target.value)}
                  className="h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Warehouses</option>
                  {warehousesQuery.data?.items?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="erp-panel overflow-hidden border border-border rounded-lg bg-card shadow-2xs">
              <div className="overflow-x-auto">
                <table className="erp-table min-w-[700px] w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Short Code</th>
                      <th className="py-2.5 px-3">Location Name</th>
                      <th className="py-2.5 px-3">Warehouse</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locationsQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-40" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="p-3 text-center">
                            <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                          </td>
                          <td className="p-3 text-right">
                            <Skeleton className="h-7 w-12 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (locationsQuery.data?.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12">
                          <EmptyState
                            icon={<MapPin className="size-10 text-muted-foreground" />}
                            title="No locations found"
                            description="Configure bins, aisles, or racks within your warehouses."
                            action={
                              <Button size="sm" onClick={openNewModal} className="mt-2">
                                Create Location
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      (locationsQuery.data?.items || []).map((l) => (
                        <tr
                          key={l.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => {
                            setEditingLoc(l);
                            setEditLocName(l.name);
                            setEditLocDesc(l.description || '');
                            setEditLocStatus(l.status);
                            setEditLocError(null);
                          }}
                        >
                          <td className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                            {l.shortCode}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground">{l.name}</div>
                            {l.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {l.description}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                              {l.warehouseName || '—'}
                            </span>
                          </td>
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant={l.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={`text-[11px] font-semibold tracking-wider ${
                                l.status === 'ACTIVE'
                                  ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {l.status}
                            </Badge>
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLoc(l);
                                setEditLocName(l.name);
                                setEditLocDesc(l.description || '');
                                setEditLocStatus(l.status);
                                setEditLocError(null);
                              }}
                              className="size-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATEGORIES */}
        {/* ========================================================================= */}
        {tab === 'categories' && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 bg-card border border-border p-3 rounded-lg shadow-2xs">
              <div className="flex flex-1 items-center gap-2 max-w-md relative">
                <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search categories by name..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div className="erp-panel overflow-hidden border border-border rounded-lg bg-card shadow-2xs">
              <div className="overflow-x-auto">
                <table className="erp-table min-w-[650px] w-full text-left text-sm">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Category Name</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-center">Products</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {categoriesQuery.isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="p-3">
                            <Skeleton className="h-4 w-48" />
                          </td>
                          <td className="p-3 text-center">
                            <Skeleton className="h-4 w-10 mx-auto" />
                          </td>
                          <td className="p-3 text-center">
                            <Skeleton className="h-5 w-16 mx-auto rounded-full" />
                          </td>
                          <td className="p-3 text-right">
                            <Skeleton className="h-7 w-12 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (categoriesQuery.data?.items || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12">
                          <EmptyState
                            icon={<Tags className="size-10 text-muted-foreground" />}
                            title="No categories found"
                            description="Create product categories to organize your inventory catalog."
                            action={
                              <Button size="sm" onClick={openNewModal} className="mt-2">
                                Create Category
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      (categoriesQuery.data?.items || []).map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => {
                            setEditingCat(c);
                            setEditCatName(c.name);
                            setEditCatDesc(c.description || '');
                            setEditCatStatus(c.status);
                            setEditCatError(null);
                          }}
                        >
                          <td className="py-2.5 px-3 font-semibold text-foreground">{c.name}</td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">
                            {c.description || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-xs font-semibold">
                            {c.productCount ?? 0}
                          </td>
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Badge
                              variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={`text-[11px] font-semibold tracking-wider ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCat(c);
                                setEditCatName(c.name);
                                setEditCatDesc(c.description || '');
                                setEditCatStatus(c.status);
                                setEditCatError(null);
                              }}
                              className="size-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageBody>

      {/* Warehouse Create Modal */}
      <Dialog
        open={isWhCreateOpen}
        onOpenChange={setIsWhCreateOpen}
        title="Register New Warehouse"
        description="Add a physical warehouse or regional depot."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsWhCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveWarehouse}
              disabled={createWarehouseMutation.isPending}
            >
              {createWarehouseMutation.isPending ? 'Saving...' : 'Save Warehouse'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {whError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{whError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Facility Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Pune Regional Depot"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Facility Code <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. WH-PUNE"
              value={whCode}
              onChange={(e) => setWhCode(e.target.value.toUpperCase())}
              required
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Unique identifier for warehouse transfers
            </span>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Physical Address
            </label>
            <Input
              placeholder="e.g. Plot 15, Industrial Zone Phase 2"
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={whDesc}
              onChange={(e) => setWhDesc(e.target.value)}
              placeholder="Operations profile, dock counts, storage type..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>

      {/* Warehouse Edit Modal */}
      <Dialog
        open={!!editingWh}
        onOpenChange={(open) => !open && setEditingWh(null)}
        title={`Edit Warehouse — ${editingWh?.code}`}
        description="Update facility information and operational status."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setEditingWh(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateWarehouse}
              disabled={updateWarehouseMutation.isPending}
            >
              {updateWarehouseMutation.isPending ? 'Saving...' : 'Update Facility'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {editWhError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{editWhError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Facility Name</label>
            <Input value={editWhName} onChange={(e) => setEditWhName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Address</label>
            <Input value={editWhAddress} onChange={(e) => setEditWhAddress(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Status</label>
            <select
              value={editWhStatus}
              onChange={(e) => setEditWhStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={editWhDesc}
              onChange={(e) => setEditWhDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>

      {/* Location Create Modal */}
      <Dialog
        open={isLocCreateOpen}
        onOpenChange={setIsLocCreateOpen}
        title="Register New Storage Location"
        description="Define a bin, shelf, or staging area inside a warehouse."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsLocCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveLocation}
              disabled={createLocationMutation.isPending}
            >
              {createLocationMutation.isPending ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {locError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{locError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Warehouse <span className="text-destructive">*</span>
            </label>
            <select
              value={locWhId}
              onChange={(e) => setLocWhId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select Warehouse...</option>
              {warehousesQuery.data?.items?.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Location Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Stock 1 (Aisle 1, Rack A)"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Short Code <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Stock1"
              value={locCode}
              onChange={(e) => setLocCode(e.target.value.toUpperCase())}
              required
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              Unique within this warehouse
            </span>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={locDesc}
              onChange={(e) => setLocDesc(e.target.value)}
              placeholder="Storage type, picking zone, capacity notes..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>

      {/* Location Edit Modal */}
      <Dialog
        open={!!editingLoc}
        onOpenChange={(open) => !open && setEditingLoc(null)}
        title={`Edit Location — ${editingLoc?.shortCode}`}
        description="Update storage location details and status."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setEditingLoc(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateLocation}
              disabled={updateLocationMutation.isPending}
            >
              {updateLocationMutation.isPending ? 'Saving...' : 'Update Location'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {editLocError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{editLocError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Location Name</label>
            <Input value={editLocName} onChange={(e) => setEditLocName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Status</label>
            <select
              value={editLocStatus}
              onChange={(e) => setEditLocStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={editLocDesc}
              onChange={(e) => setEditLocDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>

      {/* Category Create Modal */}
      <Dialog
        open={isCatCreateOpen}
        onOpenChange={setIsCatCreateOpen}
        title="Create Product Category"
        description="Categorize catalog items for easier inventory classification."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCatCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {catError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{catError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Category Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Raw Materials"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Scope of products classified under this category..."
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>

      {/* Category Edit Modal */}
      <Dialog
        open={!!editingCat}
        onOpenChange={(open) => !open && setEditingCat(null)}
        title={`Edit Category — ${editingCat?.name}`}
        description="Update category classification and status."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setEditingCat(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Update Category'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 py-1 text-sm">
          {editCatError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{editCatError}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Category Name</label>
            <Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Status</label>
            <select
              value={editCatStatus}
              onChange={(e) => setEditCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Description</label>
            <textarea
              rows={2}
              value={editCatDesc}
              onChange={(e) => setEditCatDesc(e.target.value)}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center">
          <Skeleton className="h-10 w-48 mx-auto" />
        </div>
      }
    >
      <SettingsContent />
    </React.Suspense>
  );
}
