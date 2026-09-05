import type { ImageBlockData } from '../../../types/decoration.types';

interface Props {
  data: ImageBlockData;
}

const RATIO_CLASS: Record<NonNullable<ImageBlockData['ratio']>, string> = {
  wide: 'aspect-[16/5]',
  square: 'aspect-square',
  tall: 'aspect-[3/4]',
};

/** A single image banner, optionally linking somewhere. Storefront tokens. */
export function ImageBlock({ data }: Props) {
  if (!data.url) return null;

  const ratio = RATIO_CLASS[data.ratio ?? 'wide'];
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
