import { PrismaClient, PermissionEffect } from '@prisma/client';

export async function seedUserAssignmentPermissionOverride(prisma: PrismaClient) {
  console.log('🌱 Seeding UserAssignmentPermissionOverride table...');

  // Fetch existing assignments and users to use real IDs
  const assignments = await prisma.userRoleAssignment.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });

  const users = await prisma.users.findMany({
    take: 1,
    orderBy: { id: 'asc' },
  });

  if (assignments.length === 0) {
    console.warn('  ⚠️  No assignments found in database, skipping UserAssignmentPermissionOverride seeding');
    return;
  }

  const overrides = [
    ...(assignments.length > 0 ? [{
      assignment_id: assignments[0].id,
      permission_id: 5, // ROLE_MGMT CREATE - Temporarily grant
      effect: 'ALLOW' as PermissionEffect,
      reason: 'Temporary additional charge during DM absence',
      created_by: users.length > 0 ? users[0].id : null,
    }] : []),
    ...(assignments.length > 1 ? [{
      assignment_id: assignments[1].id,
      permission_id: 13, // APP_PROCESSING UPDATE - Specifically block
      effect: 'DENY' as PermissionEffect,
      reason: 'Investor should not have update access to general applications',
      created_by: users.length > 0 ? users[0].id : null,
    }] : []),
  ];

  for (const override of overrides) {
    try {
      await prisma.userAssignmentPermissionOverride.upsert({
        where: {
          assignment_id_permission_id: {
            assignment_id: override.assignment_id,
            permission_id: override.permission_id,
          },
        },
        update: override,
        create: override,
      });
      console.log(`  ✓ Override created: assignment ${override.assignment_id} - permission ${override.permission_id} - ${override.effect}`);
    } catch (error) {
      console.error(`  ✗ Error seeding override:`, error);
    }
  }

  console.log('✅ UserAssignmentPermissionOverride seeding completed.\n');
}
