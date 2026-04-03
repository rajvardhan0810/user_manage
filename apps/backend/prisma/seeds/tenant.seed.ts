import { PrismaClient } from '@prisma/client';

export async function seedTenant(prisma: PrismaClient) {
  console.log('🌱 Seeding Tenant table...');

  const tenants = [
    {
      name: 'Single Window Clearance System',
      slag: 'swcs',
      domain: null,
      logo_url: null,
      primary_color: '#1a5276',
      plan: 'STANDARD' as const,
      settings: { max_users: 1000, allow_custom_modules: true },
      is_active: true,
    },
    {
      name: 'Forest Department',
      slag: 'forest',
      domain: null,
      logo_url: null,
      primary_color: '#1e6834',
      plan: 'ENTERPRISE' as const,
      settings: { max_users: 500, allow_custom_modules: true },
      is_active: true,
    },
    {
      name: 'Urban Development',
      slag: 'urban',
      domain: null,
      logo_url: null,
      primary_color: '#2c5aa0',
      plan: 'STANDARD' as const,
      settings: { max_users: 300, allow_custom_modules: false },
      is_active: true,
    },
  ];

  for (const tenant of tenants) {
    try {
      await prisma.tenant.upsert({
        where: { slag: tenant.slag },
        update: tenant,
        create: tenant,
      });
      console.log(`  ✓ Tenant created: ${tenant.name}`);
    } catch (error) {
      console.error(`  ✗ Error seeding tenant ${tenant.name}:`, error);
    }
  }

  console.log('✅ Tenant seeding completed.\n');
}
