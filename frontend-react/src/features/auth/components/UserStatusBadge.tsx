interface Props {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

