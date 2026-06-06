interface Props {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isActive ? 'text-emerald-700' : 'text-rose-700'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-rose-500'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
