import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, MapPin, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProvinces, useWards } from '../hooks/useLocations';
import type { LocationItem, LocationValue } from '../types/user-profile.types';

/**
 * `storefront` uses the warm semantic tokens (customer address form).
 * `portal` uses the slate/amber palette so the picker matches the seller/admin
 * portals in both light and dark mode (semantic tokens go warm-brown on the
 * portal's slate dark surface).
 */
type LocationPickerVariant = 'storefront' | 'portal';

interface Props {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  error?: string;
  initialDisplayText?: string;
  variant?: LocationPickerVariant;
}

// Post-2025 merger: 2-tier hierarchy (Province/City → Ward/Commune).
const TABS = [
  { key: 'province' as const, labelKey: 'locationPicker.tabProvince' as const },
  { key: 'ward' as const, labelKey: 'locationPicker.tabWard' as const },
];

type TabKey = 'province' | 'ward';

const THEME: Record<LocationPickerVariant, {
  label: string;
  triggerIdle: string;
  triggerOpen: string;
  triggerError: string;
  valueText: string;
  placeholderText: string;
  muted: string;
  clearHover: string;
  panel: string;
  divide: string;
  search: string;
  tabActive: string;
  tabHasValue: string;
  tabIdle: string;
  optionSelected: string;
  optionIdle: string;
  check: string;
}> = {
  storefront: {
    label: 'text-text-primary',
    triggerIdle: 'border-border-default bg-surface hover:border-border-strong',
    triggerOpen: 'border-blue-400 ring-2 ring-blue-400/20',
    triggerError: 'border-rose-300 bg-rose-50/50 dark:border-rose-400/30 dark:bg-rose-500/10',
    valueText: 'text-text-primary',
    placeholderText: 'text-text-muted',
    muted: 'text-text-muted',
    clearHover: 'hover:bg-surface-hover',
    panel: 'border-border-default bg-elevated',
    divide: 'border-border-default',
    search: 'border-border-default bg-surface-hover focus:bg-surface focus:border-border-brand focus:ring-1 focus:ring-brand',
    tabActive: 'border-orange-500 text-orange-600 dark:text-orange-400',
    tabHasValue: 'border-transparent text-emerald-600 hover:text-emerald-700 dark:text-emerald-400',
    tabIdle: 'border-transparent text-text-secondary hover:text-text-primary',
    optionSelected: 'text-orange-600 bg-orange-50/60 dark:text-orange-400 dark:bg-orange-500/15 font-medium',
    optionIdle: 'text-text-secondary hover:bg-surface-hover',
    check: 'text-orange-500',
  },
  portal: {
    label: 'text-slate-700 dark:text-slate-300',
    triggerIdle: 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600',
    triggerOpen: 'border-amber-500 ring-2 ring-amber-500/20',
    triggerError: 'border-rose-300 bg-rose-50/50 dark:border-rose-400/30 dark:bg-rose-500/10',
    valueText: 'text-slate-900 dark:text-slate-100',
    placeholderText: 'text-slate-400 dark:text-slate-500',
    muted: 'text-slate-400 dark:text-slate-500',
    clearHover: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    panel: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
    divide: 'border-slate-200 dark:border-slate-700',
    search: 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800',
    tabActive: 'border-amber-500 text-amber-600 dark:text-amber-400',
    tabHasValue: 'border-transparent text-emerald-600 hover:text-emerald-700 dark:text-emerald-400',
    tabIdle: 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
    optionSelected: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15 font-medium',
    optionIdle: 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800',
    check: 'text-amber-500',
  },
};

export function LocationPicker({ value, onChange, error, initialDisplayText, variant = 'storefront' }: Props) {
  const s = THEME[variant];
  const { t } = useTranslation('userProfile');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('province');
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces();
  const { data: wards = [], isLoading: loadingWards } = useWards(
    value.province?.code ?? null,
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const items: LocationItem[] = activeTab === 'province' ? provinces : wards;

  const isLoading = activeTab === 'province' ? loadingProvinces : loadingWards;

  const filtered = search
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const displayText =
    value.ward && value.province
      ? `${value.ward.name}, ${value.province.name}`
      : value.province
        ? value.province.name
        : initialDisplayText || '';

  function handleSelect(item: LocationItem) {
    setSearch('');
    if (activeTab === 'province') {
      onChange({ province: item, ward: null });
      setActiveTab('ward');
    } else {
      onChange({ ...value, ward: item });
      setIsOpen(false);
    }
  }

  function handleTabChange(tab: TabKey) {
    if (tab === 'ward' && !value.province) return;
    setActiveTab(tab);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange({ province: null, ward: null });
    setActiveTab('province');
    setSearch('');
  }

  function isSelected(item: LocationItem): boolean {
    if (activeTab === 'province') return value.province?.code === item.code;
    return value.ward?.code === item.code;
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className={`mb-1.5 block text-sm font-medium ${s.label}`}>
        <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
        {t('locationPicker.label')}
      </label>

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
          error
            ? s.triggerError
            : isOpen
              ? s.triggerOpen
              : s.triggerIdle
        }`}
      >
        <span className={displayText ? s.valueText : s.placeholderText}>
          {displayText || t('locationPicker.placeholder')}
        </span>
        <div className="flex items-center gap-1">
          {displayText && (
            <span
              onClick={handleClear}
              className={`p-0.5 rounded ${s.clearHover}`}
            >
              <X className={`h-3.5 w-3.5 ${s.muted}`} />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 ${s.muted} transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {isOpen && (
        <div className={`absolute z-[1000] mt-1 w-full rounded-xl border shadow-xl overflow-hidden ${s.panel}`}>
          <div className={`p-2.5 border-b ${s.divide}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${s.muted}`} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('locationPicker.searchPlaceholder')}
                className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none transition-colors ${s.search}`}
              />
            </div>
          </div>

          <div className={`flex border-b ${s.divide}`}>
            {TABS.map((tab) => {
              const isDisabled = tab.key === 'ward' && !value.province;

              const isActive = activeTab === tab.key;

              const hasValue =
                (tab.key === 'province' && value.province) ||
                (tab.key === 'ward' && value.ward);

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  disabled={isDisabled}
                  className={`flex-1 px-2 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    isActive
                      ? s.tabActive
                      : isDisabled
                        ? `border-transparent ${s.muted} opacity-60 cursor-not-allowed`
                        : hasValue
                          ? s.tabHasValue
                          : s.tabIdle
                  }`}
                >
                  {t(tab.labelKey)}
                  {hasValue && !isActive && (
                    <Check className="ml-1 inline-block h-3 w-3" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            {isLoading ? (
              <div className={`flex items-center justify-center gap-2 p-6 text-sm ${s.muted}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('locationPicker.loading')}
              </div>
            ) : filtered.length === 0 ? (
              <div className={`p-6 text-center text-sm ${s.muted}`}>
                {t('locationPicker.noResults')}
              </div>
            ) : (
              filtered.map((item) => {
                const selected = isSelected(item);
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                      selected ? s.optionSelected : s.optionIdle
                    }`}
                  >
                    {item.name}
                    {selected && (
                      <Check className={`h-4 w-4 shrink-0 ${s.check}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
