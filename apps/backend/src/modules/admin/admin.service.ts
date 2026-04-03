import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';

type AdminUserPayload = {
  email: string;
  userType?: string;
  roleId?: number;
  roleIds?: number[];
  password?: string;
  isEmailVerified?: number;
  name?: string;
  hindiFullName?: string;
  officeNo?: string;
  mobile?: string;
  deptId?: number;
  districtId?: number | null;
  tahsilId?: number;
  circleId?: string;
  blockId?: number;
  officeId?: number;
  divisionId?: number;
  delegateOfficerNumber?: string;
  delegateOfficerName?: string;
  delegateOfficerEmail?: string;
  isForTesting?: number;
  isActive?: boolean;
};

type AssignmentScopePayload = {
  scopeType?: string;
  scopeId?: number | string;
  scopeLabel?: string | null;
};

const DEFAULT_TENANT_ID = 1;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRoleIds(data: Partial<AdminUserPayload>) {
    const rawRoleIds = Array.isArray(data.roleIds)
      ? data.roleIds
      : data.roleId != null
        ? [data.roleId]
        : [];

    return Array.from(
      new Set(
        rawRoleIds
          .map((roleId) => Number(roleId))
          .filter((roleId) => Number.isFinite(roleId) && roleId > 0),
      ),
    );
  }

  private async syncUserRoleAssignments(userId: bigint, tenantId: number, roleIds: number[]) {
    await this.prisma.userRoleAssignment.deleteMany({
      where: {
        user_id: userId,
        tenant_id: tenantId,
      },
    });

    if (roleIds.length === 0) return;

    await this.prisma.userRoleAssignment.createMany({
      data: roleIds.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
        tenant_id: tenantId,
        is_active: true,
      })),
    });
  }

  async getUsers() {
    const users = await this.prisma.users.findMany({
      where: { deleted_at: null },
      include: {
        role: true,
        department_user: true,
        assignments: {
          where: { is_active: true },
          include: { role: true },
          orderBy: { role_id: 'asc' },
        },
      },
      orderBy: { id: 'desc' },
    });

    return users.map((user) => {
      const assignedRoles = user.assignments.map((assignment) => ({
        id: assignment.role.id,
        name: assignment.role.name,
      }));
      const roleNames = assignedRoles.map((role) => role.name);

      return {
        id: user.id.toString(),
        email: user.email,
        passwordHash: user.password_hash ?? null,
        salt: user.salt ?? null,
        passwordAlgo: user.password_algo ?? null,
        userType: user.user_type,
        roleId: user.role_id,
        isEmailVerified: user.is_email_verified,
        lastLoginAt: user.last_login_at,
        name: user.department_user?.full_name ?? user.email,
        hindiFullName: user.department_user?.hindi_full_name ?? null,
        officeNo: user.department_user?.office_no ?? null,
        mobile: user.department_user?.mobile ?? null,
        deptId: user.department_user?.dept_id ?? null,
        districtId: user.department_user?.district_id ?? null,
        tahsilId: user.department_user?.tahsil_id ?? 0,
        circleId: user.department_user?.circle_id ?? null,
        blockId: user.department_user?.block_id ?? 0,
        officeId: user.department_user?.office_id ?? 0,
        divisionId: user.department_user?.division_id ?? 0,
        delegateOfficerNumber: user.department_user?.delegate_officer_number ?? null,
        delegateOfficerName: user.department_user?.delegate_officer_name ?? null,
        delegateOfficerEmail: user.department_user?.delegate_officer_email ?? null,
        npUserId: user.department_user?.np_user_id ?? null,
        isForTesting: user.department_user?.is_for_testing ?? 0,
        isActive: user.department_user ? user.department_user.status === 1 : true,
        createdAt: user.department_user?.created_at ?? null,
        updatedAt: user.department_user?.updated_at ?? null,
        roleName: roleNames.length ? roleNames.join(', ') : user.role?.name || null,
        roleIds: assignedRoles.map((role) => role.id),
        roles: assignedRoles,
      };
    });
  }

  async getRoles() {
    return this.prisma.roles.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  private normalizeAssignmentScopes(scopes: AssignmentScopePayload[] | undefined) {
    if (!Array.isArray(scopes)) return [];

    return scopes
      .map((scope) => {
        const scopeType = String(scope?.scopeType || '').trim().toUpperCase();
        const scopeId = Number(scope?.scopeId);
        const scopeLabel = scope?.scopeLabel ? String(scope.scopeLabel).trim() : null;

        if (!scopeType || !Number.isFinite(scopeId) || scopeId <= 0) {
          return null;
        }

        return {
          scope_type: scopeType as any,
          scope_id: scopeId,
          scope_label: scopeLabel || null,
        };
      })
      .filter((scope): scope is NonNullable<typeof scope> => Boolean(scope));
  }

  async getPermissions() {
    return this.prisma.resources.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createUser(data: AdminUserPayload) {
    const normalizedRoleIds = this.normalizeRoleIds(data);
    const primaryRoleId = normalizedRoleIds[0] ?? null;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const createdUser = await this.prisma.users.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        password_algo: 'bcrypt',
        user_type: (data.userType ?? 'DEPARTMENT') as any,
        role_id: primaryRoleId,
        tenant_id: DEFAULT_TENANT_ID,
        is_email_verified: data.isEmailVerified ?? 0,
      },
    });

    await this.prisma.department_users.create({
      data: {
        user_id: createdUser.id,
        full_name: data.name?.trim() || data.email,
        hindi_full_name: data.hindiFullName?.trim() || null,
        email: data.email,
        office_no: data.officeNo?.trim() || null,
        mobile: data.mobile?.trim() || null,
        dept_id: data.deptId ?? 1,
        district_id: data.districtId ?? null,
        tahsil_id: data.tahsilId ?? 0,
        circle_id: data.circleId?.trim() || null,
        block_id: data.blockId ?? 0,
        office_id: data.officeId ?? 0,
        division_id: data.divisionId ?? 0,
        delegate_officer_number: data.delegateOfficerNumber?.trim() || null,
        delegate_officer_name: data.delegateOfficerName?.trim() || null,
        delegate_officer_email: data.delegateOfficerEmail?.trim() || null,
        np_user_id: null,
        is_for_testing: data.isForTesting ?? 0,
        status: data.isActive === false ? 0 : 1,
      },
    });

    await this.syncUserRoleAssignments(
      createdUser.id,
      createdUser.tenant_id ?? DEFAULT_TENANT_ID,
      normalizedRoleIds,
    );

    return this.prisma.users.findUnique({
      where: { id: createdUser.id },
      include: {
        role: true,
        department_user: true,
        assignments: {
          where: { is_active: true },
          include: { role: true },
        },
      },
    });
  }

  async updateUser(id: number, data: Partial<AdminUserPayload>) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const normalizedRoleIds = this.normalizeRoleIds(data);
    const normalizedRoleId = normalizedRoleIds[0] ?? null;
    const shouldUpdatePrimaryRole = data.roleId !== undefined || data.roleIds !== undefined;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const updatedUser = await this.prisma.users.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(passwordHash !== undefined && {
          password_hash: passwordHash,
          password_algo: 'bcrypt',
        }),
        ...(data.userType !== undefined && { user_type: data.userType as any }),
        ...(shouldUpdatePrimaryRole && { role_id: normalizedRoleId }),
        ...(data.isEmailVerified !== undefined && {
          is_email_verified: data.isEmailVerified,
        }),
      },
    });

    await this.prisma.department_users.upsert({
      where: { user_id: updatedUser.id },
      update: {
        ...(data.name !== undefined && { full_name: data.name.trim() || updatedUser.email || '' }),
        ...(data.hindiFullName !== undefined && {
          hindi_full_name: data.hindiFullName.trim() || null,
        }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.officeNo !== undefined && { office_no: data.officeNo.trim() || null }),
        ...(data.mobile !== undefined && { mobile: data.mobile.trim() || null }),
        ...(data.deptId !== undefined && { dept_id: data.deptId }),
        ...(data.districtId !== undefined && { district_id: data.districtId }),
        ...(data.tahsilId !== undefined && { tahsil_id: data.tahsilId }),
        ...(data.circleId !== undefined && { circle_id: data.circleId.trim() || null }),
        ...(data.blockId !== undefined && { block_id: data.blockId }),
        ...(data.officeId !== undefined && { office_id: data.officeId }),
        ...(data.divisionId !== undefined && { division_id: data.divisionId }),
        ...(data.delegateOfficerNumber !== undefined && {
          delegate_officer_number: data.delegateOfficerNumber.trim() || null,
        }),
        ...(data.delegateOfficerName !== undefined && {
          delegate_officer_name: data.delegateOfficerName.trim() || null,
        }),
        ...(data.delegateOfficerEmail !== undefined && {
          delegate_officer_email: data.delegateOfficerEmail.trim() || null,
        }),
        np_user_id: null,
        ...(data.isForTesting !== undefined && { is_for_testing: data.isForTesting }),
        ...(data.isActive !== undefined && { status: data.isActive ? 1 : 0 }),
        updated_at: new Date(),
      },
      create: {
        user_id: updatedUser.id,
        full_name: data.name?.trim() || updatedUser.email || '',
        hindi_full_name: data.hindiFullName?.trim() || null,
        email: data.email ?? updatedUser.email ?? '',
        office_no: data.officeNo?.trim() || null,
        mobile: data.mobile?.trim() || null,
        dept_id: data.deptId ?? 1,
        district_id: data.districtId ?? null,
        tahsil_id: data.tahsilId ?? 0,
        circle_id: data.circleId?.trim() || null,
        block_id: data.blockId ?? 0,
        office_id: data.officeId ?? 0,
        division_id: data.divisionId ?? 0,
        delegate_officer_number: data.delegateOfficerNumber?.trim() || null,
        delegate_officer_name: data.delegateOfficerName?.trim() || null,
        delegate_officer_email: data.delegateOfficerEmail?.trim() || null,
        np_user_id: null,
        is_for_testing: data.isForTesting ?? 0,
        status: data.isActive === false ? 0 : 1,
      },
    });

    if (data.roleId !== undefined || data.roleIds !== undefined) {
      await this.syncUserRoleAssignments(
        updatedUser.id,
        updatedUser.tenant_id ?? DEFAULT_TENANT_ID,
        normalizedRoleIds,
      );
    }

    return this.prisma.users.findUnique({
      where: { id },
      include: {
        role: true,
        department_user: true,
        assignments: {
          where: { is_active: true },
          include: { role: true },
        },
      },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.users.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.users.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getModules() {
    return this.prisma.module.findMany({
      orderBy: [{ portal: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });
  }

  async getTenants() {
    return this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getTenantProjects() {
    return this.prisma.tenantProject.findMany({
      include: {
        tenant: true,
      },
      orderBy: [{ tenant_id: 'asc' }, { name: 'asc' }],
    });
  }

  async getAssignmentScopeOptions(scopeType: string) {
    const normalizedScopeType = String(scopeType || '').trim().toUpperCase();

    switch (normalizedScopeType) {
      case 'STATE':
        return this.prisma.state.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
      case 'DISTRICT':
        return this.prisma.district.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
      case 'BLOCK':
        return this.prisma.block.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
      case 'TEHSIL':
        return this.prisma.tehsil.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
      case 'VILLAGE':
        return this.prisma.village.findMany({
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
      case 'DIVISION':
        return this.prisma.ujsDivision.findMany({
          select: {
            id: true,
            officeName: true,
          },
          orderBy: { officeName: 'asc' },
        }).then((rows) =>
          rows.map((row) => ({
            id: row.id,
            name: row.officeName,
          })),
        );
      case 'CIRCLE':
        return this.prisma.department_users.findMany({
          where: {
            circle_id: {
              not: null,
            },
          },
          select: {
            circle_id: true,
          },
          distinct: ['circle_id'],
          orderBy: {
            circle_id: 'asc',
          },
        }).then((rows) =>
          rows
            .filter((row) => row.circle_id)
            .map((row, index) => ({
              id: index + 1,
              value: row.circle_id as string,
              name: row.circle_id as string,
            })),
        );
      case 'PROJECT':
        return this.prisma.tenantProject.findMany({
          select: { id: true, name: true, code: true, tenant_id: true },
          orderBy: { name: 'asc' },
        });
      default:
        return [];
    }
  }

  async getPermissionRecords() {
    return this.prisma.permission.findMany({
      include: {
        module: true,
      },
      orderBy: [{ module_id: 'asc' }, { action: 'asc' }],
    });
  }

  async createPermissionRecord(data: any) {
    return this.prisma.permission.create({
      data: {
        module_id: Number(data.moduleId),
        action: data.action,
        description: data.description?.trim() || null,
        is_active: data.isActive !== false,
      },
      include: {
        module: true,
      },
    });
  }

  async updatePermissionRecord(id: number, data: any) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException('Permission not found');

    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(data.moduleId !== undefined && { module_id: Number(data.moduleId) }),
        ...(data.action !== undefined && { action: data.action }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.isActive !== undefined && { is_active: Boolean(data.isActive) }),
      },
      include: {
        module: true,
      },
    });
  }

  async deletePermissionRecord(id: number) {
    const permission = await this.prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new NotFoundException('Permission not found');

    return this.prisma.permission.delete({ where: { id } });
  }

  async getUserRoleAssignments() {
    return this.prisma.userRoleAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            department_user: {
              select: {
                full_name: true,
              },
            },
          },
        },
        role: true,
        tenant: true,
        project: true,
        scopes: {
          orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
        },
        transferred_from: {
          include: {
            user: {
              select: {
                email: true,
                department_user: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
            role: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async createUserRoleAssignment(data: any) {
    const normalizedScopes = this.normalizeAssignmentScopes(data.scopes);

    return this.prisma.userRoleAssignment.create({
      data: {
        user_id: BigInt(data.userId),
        role_id: Number(data.roleId),
        tenant_id: Number(data.tenantId ?? DEFAULT_TENANT_ID),
        project_id: data.projectId ? Number(data.projectId) : null,
        valid_from: data.validFrom ? new Date(data.validFrom) : new Date(),
        valid_until: data.validUntil ? new Date(data.validUntil) : null,
        transfer_order_no: data.transferOrderNo?.trim() || null,
        transfer_reason: data.transferReason || null,
        transferred_from_id: data.transferredFromId ? Number(data.transferredFromId) : null,
        assigned_by: data.assignedBy ? BigInt(data.assignedBy) : null,
        remarks: data.remarks?.trim() || null,
        is_active: data.isActive !== false,
        scopes: normalizedScopes.length
          ? {
              create: normalizedScopes,
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            department_user: { select: { full_name: true } },
          },
        },
        role: true,
        tenant: true,
        project: true,
        scopes: {
          orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
        },
        transferred_from: {
          include: {
            user: {
              select: {
                email: true,
                department_user: { select: { full_name: true } },
              },
            },
            role: true,
          },
        },
      },
    });
  }

  async updateUserRoleAssignment(id: number, data: any) {
    const assignment = await this.prisma.userRoleAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('User role assignment not found');

    const normalizedScopes = data.scopes !== undefined
      ? this.normalizeAssignmentScopes(data.scopes)
      : null;

    return this.prisma.$transaction(async (tx) => {
      if (normalizedScopes !== null) {
        await tx.userAssignmentScope.deleteMany({
          where: { assignment_id: id },
        });
      }

      return tx.userRoleAssignment.update({
        where: { id },
        data: {
          ...(data.userId !== undefined && { user_id: BigInt(data.userId) }),
          ...(data.roleId !== undefined && { role_id: Number(data.roleId) }),
          ...(data.tenantId !== undefined && { tenant_id: Number(data.tenantId) }),
          ...(data.projectId !== undefined && {
            project_id: data.projectId ? Number(data.projectId) : null,
          }),
          ...(data.validFrom !== undefined && {
            valid_from: data.validFrom ? new Date(data.validFrom) : assignment.valid_from,
          }),
          ...(data.validUntil !== undefined && {
            valid_until: data.validUntil ? new Date(data.validUntil) : null,
          }),
          ...(data.transferOrderNo !== undefined && {
            transfer_order_no: data.transferOrderNo?.trim() || null,
          }),
          ...(data.transferReason !== undefined && {
            transfer_reason: data.transferReason || null,
          }),
          ...(data.transferredFromId !== undefined && {
            transferred_from_id: data.transferredFromId ? Number(data.transferredFromId) : null,
          }),
          ...(data.assignedBy !== undefined && {
            assigned_by: data.assignedBy ? BigInt(data.assignedBy) : null,
          }),
          ...(data.remarks !== undefined && { remarks: data.remarks?.trim() || null }),
          ...(data.isActive !== undefined && { is_active: Boolean(data.isActive) }),
          ...(normalizedScopes !== null && {
            scopes: normalizedScopes.length
              ? {
                  create: normalizedScopes,
                }
              : undefined,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              department_user: { select: { full_name: true } },
            },
          },
          role: true,
          tenant: true,
          project: true,
          scopes: {
            orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
          },
          transferred_from: {
            include: {
              user: {
                select: {
                  email: true,
                  department_user: { select: { full_name: true } },
                },
              },
              role: true,
            },
          },
        },
      });
    });
  }

  async deleteUserRoleAssignment(id: number) {
    const assignment = await this.prisma.userRoleAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('User role assignment not found');

    return this.prisma.userRoleAssignment.delete({ where: { id } });
  }

  async transferUserRoleAssignment(id: number, data: any) {
    const assignment = await this.prisma.userRoleAssignment.findUnique({
      where: { id },
      include: {
        scopes: {
          orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
        },
      },
    });

    if (!assignment) throw new NotFoundException('User role assignment not found');
    if (!assignment.is_active) {
      throw new BadRequestException('Only active assignments can be transferred');
    }

    const nextRoleId = Number(data.newRoleId ?? data.roleId);
    if (!Number.isFinite(nextRoleId) || nextRoleId <= 0) {
      throw new BadRequestException('New role is required');
    }

    const normalizedScopes = this.normalizeAssignmentScopes(data.scopes);
    if (normalizedScopes.length === 0) {
      throw new BadRequestException('At least one scope is required for transfer');
    }

    const effectiveValidFrom = data.effectiveDate ? new Date(data.effectiveDate) : new Date();

    const existingActiveSameRole = await this.prisma.userRoleAssignment.findFirst({
      where: {
        user_id: assignment.user_id,
        tenant_id: assignment.tenant_id,
        role_id: nextRoleId,
        is_active: true,
        id: { not: id },
      },
      select: { id: true },
    });

    if (existingActiveSameRole) {
      throw new BadRequestException('User already has the same role active');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.update({
        where: { id },
        data: {
          is_active: false,
          valid_until: data.closeCurrentOn ? new Date(data.closeCurrentOn) : assignment.valid_until,
        },
      });

      return tx.userRoleAssignment.create({
        data: {
          user_id: assignment.user_id,
          role_id: nextRoleId,
          tenant_id: assignment.tenant_id,
          project_id:
            data.projectId !== undefined
              ? data.projectId
                ? Number(data.projectId)
                : null
              : assignment.project_id,
          valid_from: effectiveValidFrom,
          valid_until: data.validUntil ? new Date(data.validUntil) : null,
          transfer_order_no: data.transferOrderNo?.trim() || null,
          transfer_reason: data.transferReason || null,
          transferred_from_id: assignment.id,
          assigned_by: data.assignedBy ? BigInt(data.assignedBy) : null,
          remarks: data.remarks?.trim() || null,
          is_active: true,
          scopes: {
            create: normalizedScopes,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              department_user: { select: { full_name: true } },
            },
          },
          role: true,
          tenant: true,
          project: true,
          scopes: {
            orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
          },
          transferred_from: {
            include: {
              role: true,
              scopes: {
                orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
              },
            },
          },
        },
      });
    });
  }

  async getTransferHistory() {
    return this.prisma.userRoleAssignment.findMany({
      where: {
        OR: [
          { transferred_from_id: { not: null } },
          { transfer_order_no: { not: null } },
          { transfer_reason: { not: null } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            department_user: { select: { full_name: true } },
          },
        },
        role: true,
        tenant: true,
        project: true,
        scopes: {
          orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
        },
        transferred_from: {
          include: {
            role: true,
            scopes: {
              orderBy: [{ scope_type: 'asc' }, { scope_id: 'asc' }],
            },
            user: {
              select: {
                email: true,
                department_user: { select: { full_name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPermissionOverrides(assignmentId?: number) {
    return this.prisma.userAssignmentPermissionOverride.findMany({
      where: assignmentId
        ? {
            assignment_id: assignmentId,
          }
        : undefined,
      include: {
        assignment: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                department_user: { select: { full_name: true } },
              },
            },
            role: true,
          },
        },
        permission: {
          include: {
            module: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async createPermissionOverride(data: any) {
    return this.prisma.userAssignmentPermissionOverride.upsert({
      where: {
        assignment_id_permission_id: {
          assignment_id: Number(data.assignmentId),
          permission_id: Number(data.permissionId),
        },
      },
      update: {
        effect: data.effect,
        reason: data.reason?.trim() || null,
        created_by: data.createdBy ? BigInt(data.createdBy) : null,
      },
      create: {
        assignment_id: Number(data.assignmentId),
        permission_id: Number(data.permissionId),
        effect: data.effect,
        reason: data.reason?.trim() || null,
        created_by: data.createdBy ? BigInt(data.createdBy) : null,
      },
      include: {
        assignment: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                department_user: { select: { full_name: true } },
              },
            },
            role: true,
          },
        },
        permission: {
          include: {
            module: true,
          },
        },
      },
    });
  }

  async updatePermissionOverride(id: number, data: any) {
    const override = await this.prisma.userAssignmentPermissionOverride.findUnique({
      where: { id },
    });
    if (!override) throw new NotFoundException('Permission override not found');

    return this.prisma.userAssignmentPermissionOverride.update({
      where: { id },
      data: {
        ...(data.assignmentId !== undefined && { assignment_id: Number(data.assignmentId) }),
        ...(data.permissionId !== undefined && { permission_id: Number(data.permissionId) }),
        ...(data.effect !== undefined && { effect: data.effect }),
        ...(data.reason !== undefined && { reason: data.reason?.trim() || null }),
        ...(data.createdBy !== undefined && {
          created_by: data.createdBy ? BigInt(data.createdBy) : null,
        }),
      },
      include: {
        assignment: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                department_user: { select: { full_name: true } },
              },
            },
            role: true,
          },
        },
        permission: {
          include: {
            module: true,
          },
        },
      },
    });
  }

  async deletePermissionOverride(id: number) {
    const override = await this.prisma.userAssignmentPermissionOverride.findUnique({
      where: { id },
    });
    if (!override) throw new NotFoundException('Permission override not found');

    return this.prisma.userAssignmentPermissionOverride.delete({ where: { id } });
  }
}
