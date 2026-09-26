'use client';

import * as React from 'react';
import { Button, Dialog, Input, cn } from '@stocksense/ui';
import { PageHeader, PageBody } from '../../components/erp/common';

interface WarehouseItem {
  id: string;
  name: string;
  code: string;
  address: string;
}

interface LocationItem {
  id: string;
  name: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
}

const initialWarehouses: WarehouseItem[] = [
  {
    id: 'w1',
    name: 'Main Warehouse',
    code: 'WH',
    address: 'Plot 12, Industrial Area, Pune',
  },
];

const initialLocations: LocationItem[] = [
  {
    id: 'l1',
    name: 'Stock 1',
    code: 'Stock1',
    warehouseId: 'w1',
    warehouseName: 'Main Warehouse',
  },
  {
    id: 'l2',
    name: 'Stock 2',
    code: 'Stock2',
    warehouseId: 'w1',
    warehouseName: 'Main Warehouse',
  },
];

export default function SettingsPage() {
  const [tab, setTab] = React.useState<'warehouses' | 'locations'>('warehouses');
  const [warehouses, setWarehouses] = React.useState<WarehouseItem[]>(initialWarehouses);
  const [locations, setLocations] = React.useState<LocationItem[]>(initialLocations);

  // Dialog states
  const [isWhOpen, setIsWhOpen] = React.useState(false);
  const [whName, setWhName] = React.useState('');
  const [whCode, setWhCode] = React.useState('');
  const [whAddress, setWhAddress] = React.useState('');

  const [isLocOpen, setIsLocOpen] = React.useState(false);
  const [locName, setLocName] = React.useState('');
  const [locCode, setLocCode] = React.useState('');

  const handleSaveWarehouse = () => {
    if (!whName.trim() || !whCode.trim()) return;
    const newWh: WarehouseItem = {
      id: `w${Date.now()}`,
      name: whName.trim(),
      code: whCode.trim().toUpperCase(),
      address: whAddress.trim(),
    };
    setWarehouses((prev) => [...prev, newWh]);
    setIsWhOpen(false);
    setWhName('');
    setWhCode('');
    setWhAddress('');
  };

  const handleSaveLocation = () => {
    if (!locName.trim() || !locCode.trim()) return;
    const newLoc: LocationItem = {
      id: `l${Date.now()}`,
      name: locName.trim(),
      code: locCode.trim(),
      warehouseId: 'w1',
      warehouseName: 'Main Warehouse',
    };
    setLocations((prev) => [...prev, newLoc]);
    setIsLocOpen(false);
    setLocName('');
    setLocCode('');
  };

  return (
    <>
      <PageHeader
        title={tab === 'warehouses' ? 'Warehouses' : 'Locations'}
        breadcrumb="Settings"
        actions={
          <Button
            size="sm"
            onClick={() => (tab === 'warehouses' ? setIsWhOpen(true) : setIsLocOpen(true))}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            New
          </Button>
        }
      >
        <div className="flex rounded-md border border-input bg-surface p-0.5 text-xs font-medium">
          <button
            onClick={() => setTab('warehouses')}
            className={cn(
              'px-3 py-1 rounded-sm transition-colors',
              tab === 'warehouses'
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Warehouses
          </button>
          <button
            onClick={() => setTab('locations')}
            className={cn(
              'px-3 py-1 rounded-sm transition-colors',
              tab === 'locations'
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Locations
          </button>
        </div>
      </PageHeader>

      <PageBody>
        {tab === 'warehouses' ? (
          <div className="erp-panel overflow-x-auto">
            <table className="erp-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Short code</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id}>
                    <td className="font-medium text-foreground">{w.name}</td>
                    <td className="font-mono text-xs text-primary font-semibold">{w.code}</td>
                    <td className="text-muted-foreground text-xs">{w.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="erp-panel overflow-x-auto">
            <table className="erp-table min-w-[560px]">
              <thead>
                <tr>
                  <th>Location name</th>
                  <th>Short code</th>
                  <th>Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium text-foreground">{l.name}</td>
                    <td className="font-mono text-xs text-primary font-semibold">{l.code}</td>
                    <td className="text-muted-foreground text-xs">{l.warehouseName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>

      {/* Warehouse Dialog */}
      <Dialog
        open={isWhOpen}
        onOpenChange={setIsWhOpen}
        title="New Warehouse"
        description="Register a new warehouse facility and define its short code."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsWhOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveWarehouse}>
              Save Warehouse
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input
            label="Name"
            placeholder="e.g. Pune Regional Depot"
            value={whName}
            onChange={(e) => setWhName(e.target.value)}
          />
          <Input
            label="Short code"
            placeholder="e.g. PN"
            value={whCode}
            onChange={(e) => setWhCode(e.target.value)}
          />
          <Input
            label="Address"
            placeholder="e.g. Plot 15, Industrial Zone"
            value={whAddress}
            onChange={(e) => setWhAddress(e.target.value)}
          />
        </div>
      </Dialog>

      {/* Location Dialog */}
      <Dialog
        open={isLocOpen}
        onOpenChange={setIsLocOpen}
        title="New Location"
        description="Register a new storage location inside the warehouse."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsLocOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveLocation}>
              Save Location
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 text-sm">
          <Input
            label="Location name"
            placeholder="e.g. Stock 3"
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
          />
          <Input
            label="Short code"
            placeholder="e.g. Stock3"
            value={locCode}
            onChange={(e) => setLocCode(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  );
}
