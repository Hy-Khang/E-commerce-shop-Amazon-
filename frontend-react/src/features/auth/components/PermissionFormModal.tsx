import { useState } from 'react';
import { Drawer } from '@/common/components/ui/Drawer';
import { Button } from '@/common/components/ui/Button';
import type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
} from '../types/admin.types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Present → edit mode (resource/action immutable); absent → create mode. */
  permission?: Permission | null;
  isPending: boolean;
  onCreate: (data: CreatePermissionRequest) => void;
  onUpdate: (data: UpdatePermissionRequest) => void;
}

export function PermissionFormModal({
  open,
  onClose,
  permission,
  isPending,
  onCreate,
  onUpdate,
}: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={permission ? 'Edit Permission' : 'Add Permission'}
      variant="modal"
      size="md"
    >
      {/* Rendered only while the drawer is open, so field state resets on each open. */}
      <PermissionFields
        permission={permission}
        isPending={isPending}
        onCancel={onClose}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </Drawer>
  );
}

interface FieldsProps {
  permission?: Permission | null;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (data: CreatePermissionRequest) => void;
  onUpdate: (data: UpdatePermissionRequest) => void;
}

function PermissionFields({ permission, isPending, onCancel, onCreate, onUpdate }: FieldsProps) {
  const isEdit = !!permission;
  const [name, setName] = useState(permission?.name ?? '');
  const [resource, setResource] = useState(permission?.resource ?? '');
  const [action, setAction] = useState(permission?.action ?? '');
  const [description, setDescription] = useState(permission?.description ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      if (!name.trim()) return;
      onUpdate({ name: name.trim(), description: description.trim() || undefined });
    } else {
      if (!name.trim() || !resource.trim() || !action.trim()) return;
      onCreate({
        name: name.trim(),
        resource: resource.trim().toLowerCase(),
        action: action.trim().toLowerCase(),
        description: description.trim() || undefined,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="perm-name" className="block text-sm font-medium text-slate-700">Name</label>
        <input
          id="perm-name"
          type="text"
          placeholder="e.g. Create Product"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="admin-input mt-1"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="perm-resource" className="block text-sm font-medium text-slate-700">
            Resource {isEdit && <span className="text-xs text-slate-400">(immutable)</span>}
          </label>
          <input
            id="perm-resource"
            type="text"
            placeholder="e.g. products"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            readOnly={isEdit}
            className={`admin-input mt-1 ${isEdit ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
            required
          />
        </div>
        <div>
          <label htmlFor="perm-action" className="block text-sm font-medium text-slate-700">
            Action {isEdit && <span className="text-xs text-slate-400">(immutable)</span>}
          </label>
          <input
            id="perm-action"
            type="text"
            placeholder="e.g. create"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            readOnly={isEdit}
            className={`admin-input mt-1 ${isEdit ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="perm-description" className="block text-sm font-medium text-slate-700">
          Description <span className="text-xs text-slate-400">(optional)</span>
        </label>
        <input
          id="perm-description"
          type="text"
          placeholder="Short description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="admin-input mt-1"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
