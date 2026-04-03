import { PrismaClient } from '@prisma/client';

export async function seedTenantProject(prisma: PrismaClient) {
  console.log('🌱 Seeding TenantProject table...');

  const projects = [
    {
      tenant_id: 1,
      name: 'MSME Clearance 2024',
      code: 'MSME_2024',
      description: 'MSME clearance process for year 2024',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      is_active: true,
    },
    {
      tenant_id: 1,
      name: 'Forest NOC Phase-2',
      code: 'FOREST_NOC_P2',
      description: 'Forest NOC clearance phase 2',
      start_date: new Date('2024-02-15'),
      end_date: null,
      is_active: true,
    },
    {
      tenant_id: 2,
      name: 'Environmental Impact Assessment',
      code: 'EIA_2024',
      description: 'EIA approval process',
      start_date: new Date('2024-01-01'),
      end_date: null,
      is_active: true,
    },
    {
      tenant_id: 3,
      name: 'Urban Planning Initiative',
      code: 'UPI_2024',
      description: 'Urban planning and development project',
      start_date: new Date('2024-03-01'),
      end_date: new Date('2025-03-01'),
      is_active: true,
    },
  ];

  for (const project of projects) {
    try {
      await prisma.tenantProject.upsert({
        where: {
          tenant_id_code: {
            tenant_id: project.tenant_id,
            code: project.code,
          },
        },
        update: project,
        create: project,
      });
      console.log(`  ✓ Project created: ${project.name}`);
    } catch (error) {
      console.error(`  ✗ Error seeding project ${project.name}:`, error);
    }
  }

  console.log('✅ TenantProject seeding completed.\n');
}
