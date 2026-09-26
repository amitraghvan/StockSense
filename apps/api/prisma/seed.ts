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
