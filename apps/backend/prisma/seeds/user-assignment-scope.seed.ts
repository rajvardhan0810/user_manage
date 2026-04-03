import { PrismaClient, ScopeType } from '@prisma/client';

export async function seedUserAssignmentScope(prisma: PrismaClient) {
  console.log('🌱 Seeding UserAssignmentScope table...');

  // Fetch existing assignments to use real IDs
  const assignments = await prisma.userRoleAssignment.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });

  if (assignments.length === 0) {
    console.warn('  ⚠️  No assignments found in database, skipping UserAssignmentScope seeding');
    return;
  }

  const scopes = [
    {
      assignment_id: assignments[0].id,
      scope_type: 'STATE' as ScopeType,
      scope_id: 0, // 0 = all states
      scope_label: 'All States',
    },
    ...(assignments.length > 0 ? [{
      assignment_id: assignments[0].id,
      scope_type: 'DISTRICT' as ScopeType,
      scope_id: 1, // Assuming district ID 1 exists
      scope_label: 'Dehradun',
    }] : []),
    ...(assignments.length > 0 ? [{
      assignment_id: assignments[0].id,
      scope_type: 'DISTRICT' as ScopeType,
      scope_id: 2, // Assuming district ID 2 exists
      scope_label: 'Haridwar',
    }] : []),
    ...(assignments.length > 1 ? [{
      assignment_id: assignments[1].id,
      scope_type: 'PROJECT' as ScopeType,
      scope_id: 1, // MSME_2024 project
      scope_label: 'MSME Clearance 2024',
    }] : []),
  ];

  for (const scope of scopes) {
    try {
      await prisma.userAssignmentScope.upsert({
        where: {
          assignment_id_scope_type_scope_id: {
            assignment_id: scope.assignment_id,
            scope_type: scope.scope_type,
            scope_id: scope.scope_id,
          },
        },
        update: scope,
        create: scope,
      });
      console.log(`  ✓ Scope created: assignment ${scope.assignment_id} - ${scope.scope_type} ${scope.scope_id}`);
    } catch (error) {
      console.error(`  ✗ Error seeding scope:`, error);
    }
  }

  console.log('✅ UserAssignmentScope seeding completed.\n');
}
