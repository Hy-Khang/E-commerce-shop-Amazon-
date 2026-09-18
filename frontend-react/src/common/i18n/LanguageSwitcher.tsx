import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
] as const;

/**
 * EN ⇄ VI language switcher. Mirrors ThemeToggle's dropdown pattern + storefront
 * semantic tokens (also reused inside the portal account dropdown, like ThemeToggle).
 */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const active = (i18n.language || 'en').split('-')[0];
  const current = LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg p-2 text-text-secondary hover:bg-surface-hover transition-colors"
        aria-label={t('language.label')}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Globe className="h-5 w-5" />
        <span className="text-xs font-semibold">{current.short}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-xl border border-border-default bg-elevated py-1 shadow-lg shadow-neutral-900/5"
          >
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === active;
              return (
                <button
                  key={lang.code}
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    void i18n.changeLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-light font-semibold text-text-brand'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  {lang.label}
                  {isActive && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
