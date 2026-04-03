import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Resource } from '../../common/resource.decorator';
import { AdminService } from '../admin/admin.service';
import { ResponseHelper } from '../../common/response.helper';

@Controller('admin')
@UseGuards(JwtGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Resource('MASTER_ALL')
  @Get('users')
  async getUsers() {
    const users = await this.adminService.getUsers();
    return ResponseHelper.success('Users fetched successfully', users);
  }

  @Resource('MASTER_ALL')
  @Post('users')
  async createUser(@Body() body: any) {
    const user = await this.adminService.createUser(body);
    return ResponseHelper.success('User created successfully', user);
  }

  @Resource('MASTER_ALL')
  @Put('users/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    const user = await this.adminService.updateUser(id, body);
    return ResponseHelper.success('User updated successfully', user);
  }

  @Resource('MASTER_ALL')
  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
    return ResponseHelper.success('User deleted successfully', null);
  }

  @Resource('MASTER_ALL')
  @Get('roles')
  async getRoles() {
    const roles = await this.adminService.getRoles();
    return ResponseHelper.success('Roles fetched successfully', roles);
  }

  @Resource('MASTER_ALL')
  @Get('permissions')
  async getPermissions() {
    const permissions = await this.adminService.getPermissions();
    return ResponseHelper.success(
      'Permissions fetched successfully',
      permissions,
    );
  }

  @Resource('MASTER_ALL')
  @Get('user-management/modules')
  async getModules() {
    const modules = await this.adminService.getModules();
    return ResponseHelper.success('Modules fetched successfully', modules);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/tenants')
  async getTenants() {
    const tenants = await this.adminService.getTenants();
    return ResponseHelper.success('Tenants fetched successfully', tenants);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/projects')
  async getTenantProjects() {
    const projects = await this.adminService.getTenantProjects();
    return ResponseHelper.success('Projects fetched successfully', projects);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/assignment-scope-options')
  async getAssignmentScopeOptions(@Query('scopeType') scopeType: string) {
    const options = await this.adminService.getAssignmentScopeOptions(scopeType);
    return ResponseHelper.success('Assignment scope options fetched successfully', options);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/permissions')
  async getPermissionRecords() {
    const permissions = await this.adminService.getPermissionRecords();
    return ResponseHelper.success('Permission records fetched successfully', permissions);
  }

  @Resource('MASTER_ALL')
  @Post('user-management/permissions')
  async createPermissionRecord(@Body() body: any) {
    const permission = await this.adminService.createPermissionRecord(body);
    return ResponseHelper.success('Permission record created successfully', permission);
  }

  @Resource('MASTER_ALL')
  @Put('user-management/permissions/:id')
  async updatePermissionRecord(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const permission = await this.adminService.updatePermissionRecord(id, body);
    return ResponseHelper.success('Permission record updated successfully', permission);
  }

  @Resource('MASTER_ALL')
  @Delete('user-management/permissions/:id')
  async deletePermissionRecord(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deletePermissionRecord(id);
    return ResponseHelper.success('Permission record deleted successfully', null);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/assignments')
  async getUserRoleAssignments() {
    const assignments = await this.adminService.getUserRoleAssignments();
    return ResponseHelper.success('User role assignments fetched successfully', assignments);
  }

  @Resource('MASTER_ALL')
  @Post('user-management/assignments')
  async createUserRoleAssignment(@Body() body: any) {
    const assignment = await this.adminService.createUserRoleAssignment(body);
    return ResponseHelper.success('User role assignment created successfully', assignment);
  }

  @Resource('MASTER_ALL')
  @Put('user-management/assignments/:id')
  async updateUserRoleAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const assignment = await this.adminService.updateUserRoleAssignment(id, body);
    return ResponseHelper.success('User role assignment updated successfully', assignment);
  }

  @Resource('MASTER_ALL')
  @Delete('user-management/assignments/:id')
  async deleteUserRoleAssignment(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUserRoleAssignment(id);
    return ResponseHelper.success('User role assignment deleted successfully', null);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/transfers')
  async getTransferHistory() {
    const transfers = await this.adminService.getTransferHistory();
    return ResponseHelper.success('Transfer history fetched successfully', transfers);
  }

  @Resource('MASTER_ALL')
  @Get('user-management/permission-overrides')
  async getPermissionOverrides() {
    const overrides = await this.adminService.getPermissionOverrides();
    return ResponseHelper.success('Permission overrides fetched successfully', overrides);
  }

  @Resource('MASTER_ALL')
  @Post('user-management/permission-overrides')
  async createPermissionOverride(@Body() body: any) {
    const override = await this.adminService.createPermissionOverride(body);
    return ResponseHelper.success('Permission override created successfully', override);
  }

  @Resource('MASTER_ALL')
  @Put('user-management/permission-overrides/:id')
  async updatePermissionOverride(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    const override = await this.adminService.updatePermissionOverride(id, body);
    return ResponseHelper.success('Permission override updated successfully', override);
  }

  @Resource('MASTER_ALL')
  @Delete('user-management/permission-overrides/:id')
  async deletePermissionOverride(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deletePermissionOverride(id);
    return ResponseHelper.success('Permission override deleted successfully', null);
  }
}
