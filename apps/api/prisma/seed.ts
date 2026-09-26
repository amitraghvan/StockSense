import { PrismaClient } from '@prisma/client';
import { SystemPermissions } from '@stocksense/validation';

const prisma = new PrismaClient();

export const DEFAULT_PERMISSIONS = [
  // Products
  {
    key: SystemPermissions.PRODUCT_VIEW,
    description: 'View products, categories, and SKU details',
    module: 'product',
  },
  {
    key: SystemPermissions.PRODUCT_CREATE,
    description: 'Create new products and SKU records',
    module: 'product',
  },
  {
    key: SystemPermissions.PRODUCT_UPDATE,
    description: 'Update existing product information and attributes',
    module: 'product',
  },
  {
    key: SystemPermissions.PRODUCT_DELETE,
    description: 'Delete or archive product catalog entries',
    module: 'product',
  },

  // Operations: Receipts
  {
    key: SystemPermissions.RECEIPT_VIEW,
    description: 'View inbound receipts and vendor delivery orders',
    module: 'operation',
  },
  {
    key: SystemPermissions.RECEIPT_CREATE,
    description: 'Draft new inbound receipt records',
    module: 'operation',
  },
  {
    key: SystemPermissions.RECEIPT_VALIDATE,
    description: 'Validate and receive stock items into warehouse',
    module: 'operation',
  },

  // Operations: Deliveries
  {
    key: SystemPermissions.DELIVERY_VIEW,
    description: 'View outbound deliveries and customer dispatches',
    module: 'operation',
  },
  {
    key: SystemPermissions.DELIVERY_CREATE,
    description: 'Draft new outbound delivery records',
    module: 'operation',
  },
  {
    key: SystemPermissions.DELIVERY_VALIDATE,
    description: 'Validate and dispatch outgoing goods from warehouse',
    module: 'operation',
  },

  // Operations: Internal Transfers
  {
    key: SystemPermissions.TRANSFER_VIEW,
    description: 'View internal stock transfers across locations',
    module: 'operation',
  },
  {
    key: SystemPermissions.TRANSFER_CREATE,
    description: 'Draft internal warehouse transfer orders',
    module: 'operation',
  },
  {
    key: SystemPermissions.TRANSFER_VALIDATE,
    description: 'Validate stock movements between warehouse bins',
    module: 'operation',
  },

  // Operations: Adjustments
  {
    key: SystemPermissions.ADJUSTMENT_VIEW,
    description: 'View inventory count adjustments and scrap logs',
    module: 'operation',
  },
  {
    key: SystemPermissions.ADJUSTMENT_CREATE,
    description: 'Draft stock count variance adjustments',
    module: 'operation',
  },
  {
    key: SystemPermissions.ADJUSTMENT_VALIDATE,
    description: 'Apply inventory balance write-offs or corrections',
    module: 'operation',
  },

  // Warehouses & Stock
  {
    key: SystemPermissions.WAREHOUSE_VIEW,
    description: 'View warehouses, aisles, racks, and bin locations',
    module: 'warehouse',
  },
  {
    key: SystemPermissions.WAREHOUSE_MANAGE,
    description: 'Create, modify, and configure warehouse structures',
    module: 'warehouse',
  },
  {
    key: SystemPermissions.STOCK_VIEW,
    description: 'Inspect live stock balances and quantities on hand',
    module: 'stock',
  },

  // Reports
  {
    key: SystemPermissions.REPORTS_VIEW,
    description: 'Generate and view stock valuation and inventory reports',
    module: 'report',
  },

  // Organization & Tenant Administration
  {
    key: SystemPermissions.TENANT_MANAGE,
    description: 'Configure tenant profile, workspaces, and organization settings',
    module: 'tenant',
  },
  {
    key: SystemPermissions.USER_MANAGE,
    description: 'Invite, manage, and assign roles to workspace users',
    module: 'user',
  },
  {
    key: SystemPermissions.ROLE_MANAGE,
    description: 'Manage permissions and workspace roles',
    module: 'role',
  },
  {
    key: SystemPermissions.AUDIT_VIEW,
    description: 'Inspect identity and operational audit event history',
    module: 'audit',
  },
];

export const ROLE_DEFINITIONS: Record<string, { description: string; permissions: string[] }> = {
  SUPER_ADMIN: {
    description: 'Super Administrator with unrestricted platform-wide access',
    permissions: Object.values(SystemPermissions),
  },
  ADMIN: {
    description: 'Workspace Administrator with full organization and inventory control',
    permissions: [
      SystemPermissions.PRODUCT_VIEW,
      SystemPermissions.PRODUCT_CREATE,
      SystemPermissions.PRODUCT_UPDATE,
      SystemPermissions.PRODUCT_DELETE,
      SystemPermissions.RECEIPT_VIEW,
      SystemPermissions.RECEIPT_CREATE,
      SystemPermissions.RECEIPT_VALIDATE,
      SystemPermissions.DELIVERY_VIEW,
      SystemPermissions.DELIVERY_CREATE,
      SystemPermissions.DELIVERY_VALIDATE,
      SystemPermissions.TRANSFER_VIEW,
      SystemPermissions.TRANSFER_CREATE,
      SystemPermissions.TRANSFER_VALIDATE,
      SystemPermissions.ADJUSTMENT_VIEW,
      SystemPermissions.ADJUSTMENT_CREATE,
      SystemPermissions.ADJUSTMENT_VALIDATE,
      SystemPermissions.WAREHOUSE_VIEW,
      SystemPermissions.WAREHOUSE_MANAGE,
      SystemPermissions.STOCK_VIEW,
      SystemPermissions.REPORTS_VIEW,
      SystemPermissions.TENANT_MANAGE,
      SystemPermissions.USER_MANAGE,
      SystemPermissions.ROLE_MANAGE,
      SystemPermissions.AUDIT_VIEW,
    ],
  },
  INVENTORY_MANAGER: {
    description: 'Inventory Manager responsible for catalog, receipts, deliveries, and stock',
    permissions: [
      SystemPermissions.PRODUCT_VIEW,
      SystemPermissions.PRODUCT_CREATE,
      SystemPermissions.PRODUCT_UPDATE,
      SystemPermissions.PRODUCT_DELETE,
      SystemPermissions.RECEIPT_VIEW,
      SystemPermissions.RECEIPT_CREATE,
      SystemPermissions.RECEIPT_VALIDATE,
      SystemPermissions.DELIVERY_VIEW,
      SystemPermissions.DELIVERY_CREATE,
      SystemPermissions.DELIVERY_VALIDATE,
      SystemPermissions.TRANSFER_VIEW,
      SystemPermissions.TRANSFER_CREATE,
      SystemPermissions.TRANSFER_VALIDATE,
      SystemPermissions.ADJUSTMENT_VIEW,
      SystemPermissions.ADJUSTMENT_CREATE,
      SystemPermissions.ADJUSTMENT_VALIDATE,
      SystemPermissions.WAREHOUSE_VIEW,
      SystemPermissions.STOCK_VIEW,
      SystemPermissions.REPORTS_VIEW,
    ],
  },
  WAREHOUSE_MANAGER: {
    description:
      'Warehouse Manager overseeing physical storage, transfers, and warehouse configuration',
    permissions: [
      SystemPermissions.PRODUCT_VIEW,
      SystemPermissions.RECEIPT_VIEW,
      SystemPermissions.RECEIPT_CREATE,
      SystemPermissions.RECEIPT_VALIDATE,
      SystemPermissions.DELIVERY_VIEW,
      SystemPermissions.DELIVERY_CREATE,
      SystemPermissions.DELIVERY_VALIDATE,
      SystemPermissions.TRANSFER_VIEW,
      SystemPermissions.TRANSFER_CREATE,
      SystemPermissions.TRANSFER_VALIDATE,
      SystemPermissions.ADJUSTMENT_VIEW,
      SystemPermissions.ADJUSTMENT_CREATE,
      SystemPermissions.ADJUSTMENT_VALIDATE,
      SystemPermissions.WAREHOUSE_VIEW,
      SystemPermissions.WAREHOUSE_MANAGE,
      SystemPermissions.STOCK_VIEW,
      SystemPermissions.REPORTS_VIEW,
    ],
  },
  WAREHOUSE_STAFF: {
    description: 'Warehouse Staff handling day-to-day picking, packing, and bin stocking',
    permissions: [
      SystemPermissions.PRODUCT_VIEW,
      SystemPermissions.RECEIPT_VIEW,
      SystemPermissions.RECEIPT_CREATE,
      SystemPermissions.DELIVERY_VIEW,
      SystemPermissions.DELIVERY_CREATE,
      SystemPermissions.TRANSFER_VIEW,
      SystemPermissions.TRANSFER_CREATE,
      SystemPermissions.ADJUSTMENT_VIEW,
      SystemPermissions.WAREHOUSE_VIEW,
      SystemPermissions.STOCK_VIEW,
    ],
  },
  VIEWER: {
    description: 'Read-only observer with inspection capabilities across inventory',
    permissions: [
      SystemPermissions.PRODUCT_VIEW,
      SystemPermissions.RECEIPT_VIEW,
      SystemPermissions.DELIVERY_VIEW,
      SystemPermissions.TRANSFER_VIEW,
      SystemPermissions.ADJUSTMENT_VIEW,
      SystemPermissions.WAREHOUSE_VIEW,
      SystemPermissions.STOCK_VIEW,
      SystemPermissions.REPORTS_VIEW,
    ],
  },
};

export async function seedDatabase(client: PrismaClient = prisma) {
  console.log('[Seed] Seeding default system permissions...');

  // 1. Upsert Permissions
  const permissionMap = new Map<string, string>();
  for (const perm of DEFAULT_PERMISSIONS) {
    const record = await client.permission.upsert({
      where: { key: perm.key },
      update: {
        description: perm.description,
        module: perm.module,
      },
      create: {
        key: perm.key,
        description: perm.description,
        module: perm.module,
      },
    });
    permissionMap.set(record.key, record.id);
  }

  console.log(`[Seed] Seeded ${permissionMap.size} permissions.`);

  // 2. Upsert System Roles & Bindings
  for (const [roleName, roleData] of Object.entries(ROLE_DEFINITIONS)) {
    // Check if role exists with tenantId: null
    let role = await client.role.findFirst({
      where: {
        name: roleName,
        tenantId: null,
      },
    });

    if (!role) {
      role = await client.role.create({
        data: {
          name: roleName,
          description: roleData.description,
          isSystem: true,
          tenantId: null,
        },
      });
    } else {
      await client.role.update({
        where: { id: role.id },
        data: { description: roleData.description },
      });
    }

    // Bind permissions
    for (const permKey of roleData.permissions) {
      const permissionId = permissionMap.get(permKey);
      if (permissionId) {
        await client.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }
  }

  console.log('[Seed] System roles and permissions seeding completed.');

  // 3. Seed Master Data (Categories, Warehouses, Locations, Products) for all tenants
  const tenants = await client.tenant.findMany();
  for (const tenant of tenants) {
    console.log(`[Seed] Seeding master data for tenant: ${tenant.name} (${tenant.id})`);

    // Categories
    const categoriesData = [
      {
        key: 'electronics',
        name: 'Electronics',
        description: 'Electronic components, sensors, and microcontrollers',
      },
      {
        key: 'raw-materials',
        name: 'Raw Materials',
        description: 'Unprocessed basic materials and alloys',
      },
      {
        key: 'packaging',
        name: 'Packaging',
        description: 'Corrugated cartons, bubble wraps, and strapping',
      },
      {
        key: 'finished-goods',
        name: 'Finished Goods',
        description: 'Manufactured and assembled commercial goods',
      },
    ];

    const categoryMap = new Map<string, string>();
    for (const cat of categoriesData) {
      const record = await client.category.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: cat.name,
          },
        },
        update: { description: cat.description },
        create: {
          tenantId: tenant.id,
          name: cat.name,
          description: cat.description,
          status: 'ACTIVE',
        },
      });
      categoryMap.set(cat.key, record.id);
    }

    // Warehouses
    const wh1 = await client.warehouse.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'WH-MAIN',
        },
      },
      update: {
        name: 'Main Central Warehouse',
        address: 'Plot 12, Industrial Area, Pune',
        description: 'Primary automated fulfillment and bulk storage facility',
      },
      create: {
        tenantId: tenant.id,
        name: 'Main Central Warehouse',
        code: 'WH-MAIN',
        address: 'Plot 12, Industrial Area, Pune',
        description: 'Primary automated fulfillment and bulk storage facility',
        status: 'ACTIVE',
      },
    });

    const wh2 = await client.warehouse.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'WH-DIST',
        },
      },
      update: {
        name: 'Secondary Distribution Hub',
        address: 'Sector 5, Logistics Park, Mumbai',
        description: 'Regional cross-docking and distribution station',
      },
      create: {
        tenantId: tenant.id,
        name: 'Secondary Distribution Hub',
        code: 'WH-DIST',
        address: 'Sector 5, Logistics Park, Mumbai',
        description: 'Regional cross-docking and distribution station',
        status: 'ACTIVE',
      },
    });

    // Locations for WH-MAIN
    const mainLocations = [
      {
        name: 'Stock 1 (Aisle 1, Rack A)',
        shortCode: 'Stock1',
        description: 'Fast-moving pick zone rack 1',
      },
      {
        name: 'Stock 2 (Aisle 1, Rack B)',
        shortCode: 'Stock2',
        description: 'Fast-moving pick zone rack 2',
      },
      {
        name: 'Aisle 2 Bulk Pallet',
        shortCode: 'A2-BP-01',
        description: 'High-density pallet racking',
      },
      {
        name: 'Inbound Receiving Dock',
        shortCode: 'DOCK-IN-01',
        description: 'Incoming inspection and staging',
      },
      {
        name: 'Outbound Dispatch Dock',
        shortCode: 'DOCK-OUT-01',
        description: 'Final order staging and dispatch',
      },
    ];

    const locationMap = new Map<string, string>();
    for (const loc of mainLocations) {
      const record = await client.location.upsert({
        where: {
          warehouseId_shortCode: {
            warehouseId: wh1.id,
            shortCode: loc.shortCode,
          },
        },
        update: { name: loc.name, description: loc.description },
        create: {
          tenantId: tenant.id,
          warehouseId: wh1.id,
          name: loc.name,
          shortCode: loc.shortCode,
          description: loc.description,
          status: 'ACTIVE',
        },
      });
      locationMap.set(loc.shortCode, record.id);
    }

    // Locations for WH-DIST
    const distLocations = [
      {
        name: 'East Wing Bin 101',
        shortCode: 'E-BIN-101',
        description: 'Express delivery sorting bin',
      },
      {
        name: 'East Wing Bin 102',
        shortCode: 'E-BIN-102',
        description: 'Express delivery sorting bin',
      },
    ];
    for (const loc of distLocations) {
      await client.location.upsert({
        where: {
          warehouseId_shortCode: {
            warehouseId: wh2.id,
            shortCode: loc.shortCode,
          },
        },
        update: { name: loc.name, description: loc.description },
        create: {
          tenantId: tenant.id,
          warehouseId: wh2.id,
          name: loc.name,
          shortCode: loc.shortCode,
          description: loc.description,
          status: 'ACTIVE',
        },
      });
    }

    // Products
    const productsData = [
      {
        sku: 'DESK001',
        name: 'Desk',
        description: 'Standard ergonomic office desk with cable management',
        costPrice: 3000,
        salePrice: 4500,
        reorderLevel: 10,
        reorderQty: 25,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('finished-goods'),
      },
      {
        sku: 'TABL001',
        name: 'Table',
        description: 'Conference table 6-seater oak finish',
        costPrice: 3000,
        salePrice: 4200,
        reorderLevel: 10,
        reorderQty: 25,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('finished-goods'),
      },
      {
        sku: 'CHAI001',
        name: 'Office Chair',
        description: 'High-back mesh ergonomic executive chair',
        costPrice: 1800,
        salePrice: 2800,
        reorderLevel: 5,
        reorderQty: 20,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('finished-goods'),
      },
      {
        sku: 'SHLF001',
        name: 'Shelf Unit',
        description: '4-tier powder-coated steel shelving unit',
        costPrice: 2200,
        salePrice: 3500,
        reorderLevel: 5,
        reorderQty: 15,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('finished-goods'),
      },
      {
        sku: 'SENS-X100',
        name: 'Industrial Sensor X-100',
        description: 'High precision infrared proximity and temperature sensor',
        costPrice: 45,
        salePrice: 89,
        reorderLevel: 20,
        reorderQty: 50,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('electronics'),
      },
      {
        sku: 'PKG-BOX-01',
        name: 'Corrugated Shipping Box',
        description: 'Heavy duty double-wall corrugated carton 40x40x40cm',
        costPrice: 1.5,
        salePrice: 3.0,
        reorderLevel: 100,
        reorderQty: 500,
        unitOfMeasure: 'PCS' as const,
        categoryId: categoryMap.get('packaging'),
      },
      {
        sku: 'RAW-ALUM-01',
        name: 'Aluminum Ingot Grade A',
        description: 'High-purity primary foundry aluminum ingot 99.7%',
        costPrice: 4.2,
        salePrice: 7.0,
        reorderLevel: 500,
        reorderQty: 1000,
        unitOfMeasure: 'KG' as const,
        categoryId: categoryMap.get('raw-materials'),
      },
    ];

    for (const prod of productsData) {
      const productRecord = await client.product.upsert({
        where: {
          tenantId_sku: {
            tenantId: tenant.id,
            sku: prod.sku,
          },
        },
        update: {
          name: prod.name,
          description: prod.description,
          costPrice: prod.costPrice,
          salePrice: prod.salePrice,
          reorderLevel: prod.reorderLevel,
          reorderQty: prod.reorderQty,
          unitOfMeasure: prod.unitOfMeasure,
          categoryId: prod.categoryId,
        },
        create: {
          tenantId: tenant.id,
          sku: prod.sku,
          name: prod.name,
          description: prod.description,
          costPrice: prod.costPrice,
          salePrice: prod.salePrice,
          reorderLevel: prod.reorderLevel,
          reorderQty: prod.reorderQty,
          unitOfMeasure: prod.unitOfMeasure,
          categoryId: prod.categoryId,
          status: 'ACTIVE',
        },
      });

      // Link product to Stock1 location if available
      const stock1LocId = locationMap.get('Stock1');
      if (stock1LocId) {
        await client.productLocation.upsert({
          where: {
            productId_locationId: {
              productId: productRecord.id,
              locationId: stock1LocId,
            },
          },
          update: {},
          create: {
            tenantId: tenant.id,
            productId: productRecord.id,
            locationId: stock1LocId,
          },
        });
      }
    }
  }

  console.log('[Seed] Master data seeding completed for all tenants.');
}

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
