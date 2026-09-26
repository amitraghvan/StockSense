'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Dialog,
} from '@stocksense/ui';
import { Settings, Building2, MapPin, Plus, Shield, Sliders } from 'lucide-react';

interface WarehouseInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  isPrimary: boolean;
  status: 'Active' | 'Archived';
}

interface LocationInfo {
  id: string;
  name: string;
  path: string;
  type: 'Internal' | 'Customer' | 'Vendor' | 'Virtual / Scrap' | 'Transit';
  parent: string;
  status: 'Active' | 'Inactive';
}

const initialWarehouses: WarehouseInfo[] = [
  {
    id: 'wh-1',
    name: 'San Francisco Central Hub',
    code: 'WH',
    address: '100 Logistics Blvd, South San Francisco, CA 94080',
    isPrimary: true,
    status: 'Active',
  },
];

const initialLocations: LocationInfo[] = [
  {
    id: 'loc-1',
    name: 'Stock',
    path: 'WH/Stock',
    type: 'Internal',
    parent: 'WH',
    status: 'Active',
  },
  {
    id: 'loc-2',
    name: 'Input (Receiving Dock)',
    path: 'WH/Input',
    type: 'Internal',
    parent: 'WH',
    status: 'Active',
  },
  {
    id: 'loc-3',
    name: 'Output (Shipping Bay)',
    path: 'WH/Output',
    type: 'Internal',
    parent: 'WH',
    status: 'Active',
  },
  {
    id: 'loc-4',
    name: 'Quality Assurance',
    path: 'WH/Quality',
    type: 'Internal',
    parent: 'WH',
    status: 'Active',
  },
  {
    id: 'loc-5',
    name: 'Vendors',
    path: 'Partner/Vendors',
    type: 'Vendor',
    parent: 'Partner',
    status: 'Active',
  },
  {
    id: 'loc-6',
    name: 'Customers',
    path: 'Partner/Customers',
    type: 'Customer',
    parent: 'Partner',
    status: 'Active',
  },
  {
    id: 'loc-7',
    name: 'Inventory Loss / Scrap',
    path: 'Virtual/Inventory Loss',
    type: 'Virtual / Scrap',
    parent: 'Virtual',
    status: 'Active',
  },
  {
    id: 'loc-8',
    name: 'Inter-Warehouse Transit',
    path: 'Virtual/Transit',
    type: 'Transit',
    parent: 'Virtual',
    status: 'Active',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<'warehouses' | 'general' | 'access'>(
    'warehouses',
  );
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = React.useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = React.useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings & Configuration
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure warehouse networks, location storage trees, organization preferences, and
          operational rules.
        </p>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mt-6 border-b border-border/40 text-sm">
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'warehouses'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Warehouses & Locations</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'general'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>General Preferences</span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`pb-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'access'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Users & Access Control</span>
          </button>
        </div>
      </div>

      {activeTab === 'warehouses' && (
        <div className="space-y-8">
          {/* Warehouse Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Warehouses</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Physical distribution centers and inventory facilities registered under
                  StockSense.
                </p>
              </div>
              <Button size="sm" onClick={() => setIsAddWarehouseOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add Warehouse</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialWarehouses.map((wh) => (
                <Card
                  key={wh.id}
                  className="border-border/70 hover:border-primary/40 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-xs font-bold">
                        {wh.code}
                      </Badge>
                      {wh.isPrimary && (
                        <Badge variant="success" className="text-[10px]">
                          Primary Facility
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base pt-2">{wh.name}</CardTitle>
                    <CardDescription className="text-xs flex items-start gap-1 pt-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                      <span>{wh.address}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span>
                        Status:{' '}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      </span>
                      <span className="font-medium text-primary cursor-pointer hover:underline">
                        Manage Facility
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Locations Section (Settings -> Warehouse -> Locations UX Structure) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Locations Hierarchy</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Storage zones, aisles, racks, and virtual movement routes configured inside
                  warehouse facilities.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddLocationOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Location</span>
              </Button>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Location Path</TableHead>
                    <TableHead>Location Type</TableHead>
                    <TableHead>Parent Structure</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialLocations.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium text-foreground">{loc.name}</TableCell>
                      <TableCell className="font-mono text-xs text-primary font-semibold">
                        {loc.path}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            loc.type === 'Internal'
                              ? 'default'
                              : loc.type === 'Vendor'
                                ? 'success'
                                : loc.type === 'Customer'
                                  ? 'warning'
                                  : 'secondary'
                          }
                          className="text-[11px]"
                        >
                          {loc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{loc.parent}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {loc.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>System & Company Preferences</CardTitle>
            <CardDescription>
              Configure default unit of measures, barcode standard formats, and time zones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company Name" defaultValue="StockSense Logistics Corp." />
              <Input label="Default Timezone" defaultValue="UTC (Universal Time Coordinated)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Default Unit of Measure" defaultValue="Units (pcs)" />
              <Input
                label="Inventory Costing Method"
                defaultValue="FIFO (First-In, First-Out)"
                disabled
              />
            </div>
            <div className="pt-2">
              <Button size="sm">Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'access' && (
        <Card>
          <CardHeader>
            <CardTitle>Users & Access Roles</CardTitle>
            <CardDescription>
              Role-based access control (RBAC) across warehouse operations and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <div>
                  <div className="text-sm font-semibold">Administrator</div>
                  <div className="text-xs text-muted-foreground">admin@stocksense.local</div>
                </div>
              </div>
              <Badge variant="default">Super Admin</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Warehouse Dialog */}
      <Dialog
        open={isAddWarehouseOpen}
        onOpenChange={setIsAddWarehouseOpen}
        title="Add Distribution Warehouse"
        description="Register a new warehouse facility and initialize default receiving and dispatch zones."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddWarehouseOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsAddWarehouseOpen(false)}>
              Save Warehouse
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input label="Warehouse Name" placeholder="e.g. Chicago Regional Depot" />
          <Input label="Short Code (2-5 letters)" placeholder="e.g. CHI" />
          <Input label="Physical Address" placeholder="e.g. 500 Industrial Pkwy, Chicago, IL" />
        </div>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog
        open={isAddLocationOpen}
        onOpenChange={setIsAddLocationOpen}
        title="Add Storage Location"
        description="Define a new internal bin, rack, or virtual staging location within a warehouse."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsAddLocationOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setIsAddLocationOpen(false)}>
              Save Location
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input label="Location Name" placeholder="e.g. Aisle 3 / Shelf B" />
          <Input label="Parent Warehouse / Path" defaultValue="WH/Stock" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Location Type</label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm">
              <option>Internal Location (Storage)</option>
              <option>Input / Receiving Bay</option>
              <option>Output / Shipping Dock</option>
              <option>Scrap / Damaged Goods</option>
            </select>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
