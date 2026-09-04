import { useState } from 'react';
import type { AiQuickReplyOption } from '../types/ai-chat.types';

interface Props {
  prompt?: string;
  options: AiQuickReplyOption[];
  /** Clicking a chip sends its value as the next message. */
  onPick?: (value: string) => void;
  /**
   * Whether the chips answer the *current* pending question. Only the latest
   * turn is interactive — once a newer assistant turn arrives, this card belongs
   * to a superseded question and its chips lock (you can't re-answer a scrolled
   * away prompt). Defaults to true.
   */
  interactive?: boolean;
}

/**
 * Quick-reply chips beneath an assistant bubble — the agent's `ask_choice`
 * action. Tapping one sends its value as a new message (variant pick, coupon
 * choice…), so the shopper doesn't type. Once a chip is tapped the row locks to
 * avoid a double-send; a card from an earlier turn (`interactive=false`) renders
 * inert so a stale, scrolled-away question can't be answered out of order.
 */
export function AiQuickRepliesCard({
  prompt,
  options,
  onPick,
  interactive = true,
}: Props) {
  const [picked, setPicked] = useState<string | null>(null);

  if (!options.length) return null;

  const locked = !interactive || picked !== null;

  const handlePick = (value: string) => {
    if (locked || !onPick) return;
    setPicked(value);
    onPick(value);
  };

  return (
    <div className="mt-2">
      {prompt && (
        <p className="mb-1.5 text-xs font-medium text-text-secondary">{prompt}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt, i) => {
          const isPicked = picked === opt.value;
          return (
            <button
              key={`${opt.value}-${i}`}
              type="button"
              onClick={() => handlePick(opt.value)}
              disabled={locked}
              aria-pressed={isPicked}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                isPicked
                  ? 'border-brand bg-brand text-white'
                  : 'border-border-brand text-text-brand hover:bg-brand-light disabled:opacity-40'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
