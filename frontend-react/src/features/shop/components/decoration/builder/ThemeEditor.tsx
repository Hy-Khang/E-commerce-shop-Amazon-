import type { DecorationTheme } from '../../../types/decoration.types';

interface Props {
  theme: DecorationTheme | undefined;
  onChange: (theme: DecorationTheme | undefined) => void;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_ACCENT = '#16a34a';

/** Editor for the shop-wide accent color (portal design language). */
export function ThemeEditor({ theme, onChange }: Props) {
  const accent = theme?.accent ?? '';
  const valid = accent === '' || HEX_RE.test(accent);

  const setAccent = (value: string) =>
    onChange(value ? { ...theme, accent: value } : { ...theme, accent: undefined });

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Accent color</h3>
        <p className="text-xs text-slate-400">Applied to buttons in your decoration blocks.</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label="Accent color"
          value={HEX_RE.test(accent) ? accent : DEFAULT_ACCENT}
          onChange={(e) => setAccent(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
        <input
          className="admin-input max-w-40"
          placeholder={DEFAULT_ACCENT}
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
        />
        {accent && (
          <button
            type="button"
            onClick={() => setAccent('')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Reset
          </button>
        )}
      </div>
      {!valid && (
        <p className="text-xs text-rose-600 dark:text-rose-400">Use a hex color like #22c55e.</p>
      )}
    </div>
  );
}
