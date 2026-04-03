'use client';

import { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { ReusableDataTable, ReusableDataTableConfig, RowAction } from '@/components/DataTable';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useRoles as useAdminRoles } from '@/hooks/useAdminData';
import { User } from '@/types/user';

const DEFAULT_USER_TYPE = 'DEPARTMENT';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  hindiFullName: string;
  roleIds: number[];
  officeNo: string;
  mobile: string;
  deptId: number | null;
  districtId: string;
  tahsilId: string;
  circleId: string;
  blockId: string;
  officeId: string;
  divisionId: string;
  delegateOfficerNumber: string;
  delegateOfficerName: string;
  delegateOfficerEmail: string;
  isForTesting: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
};

const INITIAL_FORM_DATA: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  hindiFullName: '',
  roleIds: [],
  officeNo: '',
  mobile: '',
  deptId: null,
  districtId: '',
  tahsilId: '0',
  circleId: '',
  blockId: '0',
  officeId: '0',
  divisionId: '0',
  delegateOfficerNumber: '',
  delegateOfficerName: '',
  delegateOfficerEmail: '',
  isForTesting: false,
  isActive: true,
  isEmailVerified: false,
};

type UserPayload = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & Record<string, any>;

export const UserManagement = () => {
  const { data: users = [], isLoading } = useUsers();
  const { data: departments = [] } = useDepartments();
  const { data: roles = [] } = useAdminRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const toastRef = useRef<Toast | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const {
    data: tableData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<User>(users);

  const departmentOptions = departments
    .filter((department: any) => department?.isActive !== false)
    .map((department: any) => ({
      label: department.name,
      value: department.id,
    }));

  const roleOptions = roles.map((role: any) => ({
    label: role.name,
    value: role.id,
  }));

  const getUserName = (user: User) => {
    const anyUser = user as any;
    if (anyUser.name) return anyUser.name;
    return user.email;
  };

  const tableConfig: ReusableDataTableConfig<User> = {
    columns: [
      { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
      { field: 'email', header: 'Email', width: '25%', filterType: 'text' },
      {
        field: 'name',
        header: 'Name',
        width: '20%',
        filterType: 'text',
        body: (row) => <span className="font-semibold">{getUserName(row)}</span>,
      },
      {
        field: 'roleName',
        header: 'Role',
        width: '15%',
        filterType: 'text',
        body: (row) => <Tag value={(row as any).roleName || 'N/A'} severity="success" />,
      },
      {
        field: 'isActive',
        header: 'Status',
        width: '15%',
        filterType: 'select',
        filterOptions: [
          { label: 'Active', value: true },
          { label: 'Inactive', value: false },
        ],
        body: (row) => (
          <Tag
            value={(row as any).isActive ? 'Active' : 'Inactive'}
            severity={(row as any).isActive ? 'success' : 'danger'}
          />
        ),
      },
      {
        field: 'createdAt',
        header: 'Created Date',
        width: '15%',
        filterType: 'date',
        body: (row) => {
          const createdAt = (row as any).createdAt;
          return createdAt ? new Date(createdAt).toLocaleDateString() : '-';
        },
      },
    ],
    dataKey: 'id',
    rows: 10,
    rowsPerPageOptions: [5, 10, 25, 50],
    globalFilterFields: ['email', 'name', 'roleName'],
    selectable: true,
    paginator: true,
    stripedRows: true,
    showGridlines: true,
  };

  const rowActions: RowAction<User>[] = [
    {
      icon: 'pi pi-pencil',
      label: 'Edit',
      severity: 'info',
      onClick: (user) => handleEdit(user),
      tooltip: 'Edit user',
    },
    {
      icon: 'pi pi-trash',
      label: 'Delete',
      severity: 'error',
      onClick: (user) => handleDelete(user),
      tooltip: 'Delete user',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const { name, value, checked } = target;

    if (name === 'isActive' || name === 'isEmailVerified' || name === 'isForTesting') {
      setFormData({ ...formData, [name]: checked });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const buildPayload = (fd: FormData): UserPayload => {
    const toOptionalNumber = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isNaN(parsed) ? null : parsed;
    };

    return {
      email: fd.email.trim(),
      password: fd.password,
      name: fd.name.trim(),
      hindiFullName: fd.hindiFullName.trim(),
      userType: DEFAULT_USER_TYPE,
      roleIds: fd.roleIds,
      officeNo: fd.officeNo.trim(),
      mobile: fd.mobile.trim(),
      deptId: fd.deptId ?? 1,
      districtId: toOptionalNumber(fd.districtId),
      tahsilId: toOptionalNumber(fd.tahsilId) ?? 0,
      circleId: fd.circleId.trim(),
      blockId: toOptionalNumber(fd.blockId) ?? 0,
      officeId: toOptionalNumber(fd.officeId) ?? 0,
      divisionId: toOptionalNumber(fd.divisionId) ?? 0,
      delegateOfficerNumber: fd.delegateOfficerNumber.trim(),
      delegateOfficerName: fd.delegateOfficerName.trim(),
      delegateOfficerEmail: fd.delegateOfficerEmail.trim(),
      isForTesting: fd.isForTesting ? 1 : 0,
      isActive: fd.isActive,
      isEmailVerified: fd.isEmailVerified ? 1 : 0,
      lastLoginAt: '',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId === null && !formData.password) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Password Required',
          detail: 'Please enter a password.',
        });
        return;
      }

      if (formData.password || formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Password Mismatch',
            detail: 'Password and confirm password must match.',
          });
          return;
        }

        if (formData.password.length < 6) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Weak Password',
            detail: 'Password must be at least 6 characters.',
          });
          return;
        }
      }

      if (formData.roleIds.length === 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Role Required',
          detail: 'Please select at least one role.',
        });
        return;
      }

      const payload = buildPayload(formData);

      if (editingId !== null) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully',
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User created successfully',
        });
      }

      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Error saving user',
      });
    }
  };

  const handleEdit = (user: User) => {
    const anyUser = user as any;

    setFormData({
      email: user.email || '',
      password: '',
      confirmPassword: '',
      name: anyUser.name || getUserName(user),
      hindiFullName: anyUser.hindiFullName || '',
      roleIds:
        Array.isArray(anyUser.roleIds) && anyUser.roleIds.length > 0
          ? anyUser.roleIds
              .map((roleId: number | string) => Number(roleId))
              .filter((roleId: number) => !Number.isNaN(roleId))
          : anyUser.roleId != null
            ? [Number(anyUser.roleId)].filter((roleId: number) => !Number.isNaN(roleId))
            : [],
      officeNo: anyUser.officeNo || '',
      mobile: anyUser.mobile || '',
      deptId: anyUser.deptId != null ? Number(anyUser.deptId) : null,
      districtId: anyUser.districtId != null ? String(anyUser.districtId) : '',
      tahsilId: anyUser.tahsilId != null ? String(anyUser.tahsilId) : '0',
      circleId: anyUser.circleId || '',
      blockId: anyUser.blockId != null ? String(anyUser.blockId) : '0',
      officeId: anyUser.officeId != null ? String(anyUser.officeId) : '0',
      divisionId: anyUser.divisionId != null ? String(anyUser.divisionId) : '0',
      delegateOfficerNumber: anyUser.delegateOfficerNumber || '',
      delegateOfficerName: anyUser.delegateOfficerName || '',
      delegateOfficerEmail: anyUser.delegateOfficerEmail || '',
      isForTesting: anyUser.isForTesting === 1 || anyUser.isForTesting === true,
      isActive: anyUser.isActive ?? true,
      isEmailVerified: anyUser.isEmailVerified === 1 || anyUser.isEmailVerified === true,
    });

    const numericId = Number(user.id);
    if (Number.isNaN(numericId)) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Invalid ID',
        detail: 'The selected user has a non-numeric ID.',
      });
      setEditingId(null);
    } else {
      setEditingId(numericId);
    }

    setShowDialog(true);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete ${getUserName(user)}?`)) {
      try {
        const numericId = Number(user.id);
        if (Number.isNaN(numericId)) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Invalid ID',
            detail: 'Cannot delete: user ID is not numeric.',
          });
          return;
        }

        await deleteMutation.mutateAsync(numericId);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully',
        });
      } catch {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error deleting user',
        });
      }
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingId(null);
  };

  const renderTextField = (
    name: keyof FormData,
    label: string,
    placeholder: string,
    required = false,
    type: 'text' | 'email' | 'number' | 'password' = 'text'
  ) => (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
        {required ? ' *' : ''}
      </label>
      <InputText
        id={name}
        name={name}
        type={type}
        value={String(formData[name] ?? '')}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-100"
        required={required}
      />
    </div>
  );

  const leftToolbarTemplate = () => (
    <Button
      label="Add User"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  );

  const rightToolbarTemplate = () => (
    <Button
      label="Clear Filters"
      icon="pi pi-filter-slash"
      severity="secondary"
      outlined
      onClick={() => {
        clearFilters();
        handleGlobalFilterChange('');
        handleFiltersChange({});
      }}
    />
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4">
        <h1 className="h2 mb-3">User Management</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit User' : 'Add New User'}
        modal
        style={{ width: '50vw' }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-3">
            <label htmlFor="deptId" className="form-label">
              Department *
            </label>
            <Dropdown
              id="deptId"
              value={formData.deptId}
              options={departmentOptions}
              onChange={(e) => setFormData({ ...formData, deptId: e.value })}
              placeholder="Select Department"
              className="w-100"
              filter
              required
            />
          </div>

          {renderTextField('name', 'Name', 'Full Name', true)}
          {renderTextField('hindiFullName', 'Hindi Name', 'Hindi Full Name')}
          {renderTextField('email', 'Email', 'user@example.com', true, 'email')}
          {renderTextField(
            'password',
            editingId ? 'Password' : 'Password',
            editingId ? 'Leave blank to keep current password' : 'Create password',
            editingId === null,
            'password'
          )}
          {renderTextField(
            'confirmPassword',
            editingId ? 'Confirm Password' : 'Confirm Password',
            editingId ? 'Re-enter password if changing' : 'Confirm password',
            editingId === null,
            'password'
          )}

          <div className="mb-3">
            <label htmlFor="roleIds" className="form-label">
              Role *
            </label>
            <MultiSelect
              id="roleIds"
              value={formData.roleIds}
              options={roleOptions}
              onChange={(e) => setFormData({ ...formData, roleIds: e.value ?? [] })}
              placeholder="Select Role"
              className="w-100"
              filter
              display="chip"
              required
            />
          </div>

          {renderTextField('officeNo', 'Office No', 'Office Number')}
          {renderTextField('mobile', 'Mobile', 'Mobile Number')}
          {renderTextField('districtId', 'District ID', 'District ID', false, 'number')}
          {renderTextField('tahsilId', 'Tahsil ID', 'Tahsil ID', false, 'number')}
          {renderTextField('circleId', 'Circle ID', 'Circle ID')}
          {renderTextField('blockId', 'Block ID', 'Block ID', false, 'number')}
          {renderTextField('officeId', 'Office ID', 'Office ID', false, 'number')}
          {renderTextField('divisionId', 'Division ID', 'Division ID', false, 'number')}
          {renderTextField(
            'delegateOfficerNumber',
            'Delegate Officer Number',
            'Delegate Officer Number'
          )}
          {renderTextField('delegateOfficerName', 'Delegate Officer Name', 'Delegate Officer Name')}
          {renderTextField(
            'delegateOfficerEmail',
            'Delegate Officer Email',
            'Delegate Officer Email',
            false,
            'email'
          )}
          <div className="mb-3">
            <div className="form-check">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                className="form-check-input"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isActive">
                Active
              </label>
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isEmailVerified"
                name="isEmailVerified"
                type="checkbox"
                className="form-check-input"
                checked={formData.isEmailVerified}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isEmailVerified">
                Email Verified
              </label>
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isForTesting"
                name="isForTesting"
                type="checkbox"
                className="form-check-input"
                checked={formData.isForTesting}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isForTesting">
                Is For Testing
              </label>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              label={editingId ? 'Update' : 'Create'}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<User>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
      />
    </div>
  );
};
