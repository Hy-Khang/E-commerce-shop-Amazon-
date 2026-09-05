import type { RichTextBlockData } from '../../../types/decoration.types';

interface Props {
  data: RichTextBlockData;
}

/**
 * A plain-text content block. Renders `body` as plain text with preserved line
 * breaks (`whitespace-pre-line`) — never `dangerouslySetInnerHTML`, so seller
 * input can never inject markup (XSS-safe).
 */
export function RichTextBlock({ data }: Props) {
  const align = data.align === 'center' ? 'text-center' : 'text-left';

  return (
    <section className={`rounded-xl border border-border-default bg-elevated p-6 ${align}`}>
      {data.heading && (
        <h2 className="mb-3 text-xl font-bold tracking-tight text-text-primary">
          {data.heading}
        </h2>
      )}
      <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
        {data.body}
      </p>
    </section>
  );
}
