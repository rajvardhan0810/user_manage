-- CreateEnum
CREATE TYPE "tenant_plan" AS ENUM ('FREE', 'STANDARD', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "module_portal" AS ENUM ('ADMIN', 'DEPARTMENT', 'INVESTOR');

-- CreateEnum
CREATE TYPE "permission_action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE', 'REJECT', 'MANAGE');

-- CreateEnum
CREATE TYPE "permission_effect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "scope_type" AS ENUM ('STATE', 'DISTRICT', 'BLOCK', 'TEHSIL', 'CIRCLE', 'DIVISION', 'VILLAGE', 'PROJECT');

-- CreateEnum
CREATE TYPE "transfer_reason" AS ENUM ('PROMOTION', 'TRANSFER', 'DEPUTATION', 'RETIREMENT', 'RESIGNATION', 'ADMIN_CHANGE');

-- AlterTable
ALTER TABLE "m_departments" ADD COLUMN     "tenant_id" INTEGER;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_id" INTEGER,
ADD COLUMN     "tenant_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tenant_id" INTEGER;

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slag" TEXT NOT NULL,
    "domain" TEXT,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "plan" "tenant_plan" NOT NULL DEFAULT 'STANDARD',
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_projects" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER,
    "parent_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_hindi" TEXT,
    "route" TEXT,
    "icon" TEXT,
    "portal" "module_portal" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_leaf" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "action" "permission_action" NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "effect" "permission_effect" NOT NULL DEFAULT 'ALLOW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "transfer_order_no" TEXT,
    "transfer_reason" "transfer_reason",
    "transferred_from_id" INTEGER,
    "assigned_by" BIGINT,
    "remarks" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_assignment_scopes" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "scope_type" "scope_type" NOT NULL,
    "scope_id" INTEGER NOT NULL,
    "scope_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_assignment_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_assignment_permission_overrides" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "effect" "permission_effect" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" BIGINT,

    CONSTRAINT "user_assignment_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slag_key" ON "tenants"("slag");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_projects_tenant_id_code_key" ON "tenant_projects"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "modules_code_key" ON "modules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_id_action_key" ON "permissions"("module_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_user_id_tenant_id_is_active_idx" ON "user_role_assignments"("user_id", "tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "user_role_assignments_valid_from_valid_until_idx" ON "user_role_assignments"("valid_from", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "user_assignment_scopes_assignment_id_scope_type_scope_id_key" ON "user_assignment_scopes"("assignment_id", "scope_type", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_assignment_permission_overrides_assignment_id_permissi_key" ON "user_assignment_permission_overrides"("assignment_id", "permission_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_departments" ADD CONSTRAINT "m_departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_projects" ADD CONSTRAINT "tenant_projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tenant_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_transferred_from_id_fkey" FOREIGN KEY ("transferred_from_id") REFERENCES "user_role_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_assignment_scopes" ADD CONSTRAINT "user_assignment_scopes_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "user_role_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_assignment_permission_overrides" ADD CONSTRAINT "user_assignment_permission_overrides_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "user_role_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_assignment_permission_overrides" ADD CONSTRAINT "user_assignment_permission_overrides_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
