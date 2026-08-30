interface Props {
  online: boolean;
  className?: string;
}

export function PresenceDot({ online, className = '' }: Props) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        online ? 'bg-emerald-500' : 'bg-neutral-300'
      } ${className}`}
      title={online ? 'Online' : 'Offline'}
    />
  );
}
