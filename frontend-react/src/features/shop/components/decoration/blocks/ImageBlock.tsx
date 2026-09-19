import { ImageIcon } from 'lucide-react';
import type { ImageBlockData } from '../../../types/decoration.types';

interface Props {
  data: ImageBlockData;
  /** Builder preview only — shows a placeholder frame when no image is set. */
  preview?: boolean;
}

const RATIO_CLASS: Record<NonNullable<ImageBlockData['ratio']>, string> = {
  wide: 'aspect-[16/5]',
  square: 'aspect-square',
  tall: 'aspect-[3/4]',
};

/** A single image banner, optionally linking somewhere. Storefront tokens. */
export function ImageBlock({ data, preview }: Props) {
  const ratio = RATIO_CLASS[data.ratio ?? 'wide'];

  if (!data.url) {
    if (!preview) return null;
    return (
      <div
        className={`flex w-full items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-hover text-text-muted ${ratio}`}
      >
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  const img = (
    <img
      src={data.url}
      alt={data.alt ?? ''}
      className={`w-full rounded-xl object-cover ${ratio}`}
    />
  );

  if (data.href) {
    return (
      <a href={data.href} className="block overflow-hidden rounded-xl">
        {img}
      </a>
    );
  }

  return <div className="overflow-hidden rounded-xl">{img}</div>;
}
