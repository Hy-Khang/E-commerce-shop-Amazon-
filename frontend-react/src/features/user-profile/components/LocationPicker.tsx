import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, MapPin, Check, Loader2 } from 'lucide-react';
import { useProvinces, useDistricts, useWards } from '../hooks/useLocations';
import type { LocationItem, LocationValue } from '../types/user-profile.types';

interface Props {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  error?: string;
  initialDisplayText?: string;
}

const TABS = [
  { key: 'province' as const, label: 'Province/City' },
  { key: 'district' as const, label: 'District' },
  { key: 'ward' as const, label: 'Ward' },
];

type TabKey = 'province' | 'district' | 'ward';

export function LocationPicker({ value, onChange, error, initialDisplayText }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('province');
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: provinces = [], isLoading: loadingProvinces } = useProvinces();
  const { data: districts = [], isLoading: loadingDistricts } = useDistricts(
    value.province?.code ?? null,
  );
  const { data: wards = [], isLoading: loadingWards } = useWards(
    value.district?.code ?? null,
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

  const items: LocationItem[] =
    activeTab === 'province'
      ? provinces
      : activeTab === 'district'
        ? districts
        : wards;

  const isLoading =
    activeTab === 'province'
      ? loadingProvinces
      : activeTab === 'district'
        ? loadingDistricts
        : loadingWards;

  const filtered = search
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const displayText =
    value.ward && value.district && value.province
      ? `${value.ward.name}, ${value.district.name}, ${value.province.name}`
      : value.district && value.province
        ? `${value.district.name}, ${value.province.name}`
        : value.province
          ? value.province.name
          : initialDisplayText || '';

  function handleSelect(item: LocationItem) {
    setSearch('');
    if (activeTab === 'province') {
      onChange({ province: item, district: null, ward: null });
      setActiveTab('district');
    } else if (activeTab === 'district') {
      onChange({ ...value, district: item, ward: null });
      setActiveTab('ward');
    } else {
      onChange({ ...value, ward: item });
      setIsOpen(false);
    }
  }

  function handleTabChange(tab: TabKey) {
    if (tab === 'district' && !value.province) return;
    if (tab === 'ward' && !value.district) return;
    setActiveTab(tab);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange({ province: null, district: null, ward: null });
    setActiveTab('province');
    setSearch('');
  }

  function isSelected(item: LocationItem): boolean {
    if (activeTab === 'province') return value.province?.code === item.code;
    if (activeTab === 'district') return value.district?.code === item.code;
    return value.ward?.code === item.code;
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-text-primary">
        <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
        Province / District / Ward
      </label>

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
          error
            ? 'border-rose-300 bg-rose-50/50 dark:border-rose-400/30 dark:bg-rose-500/10'
            : isOpen
              ? 'border-blue-400 ring-2 ring-blue-400/20'
              : 'border-border-default bg-surface hover:border-border-strong'
        }`}
      >
        <span className={displayText ? 'text-text-primary' : 'text-text-muted'}>
          {displayText || 'Select province, district, ward...'}
        </span>
        <div className="flex items-center gap-1">
          {displayText && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-surface-hover"
            >
              <X className="h-3.5 w-3.5 text-text-muted" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

      {isOpen && (
        <div className="absolute z-[1000] mt-1 w-full rounded-xl border border-border-default bg-elevated shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-border-default">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border-default bg-surface-hover focus:bg-surface focus:outline-none focus:border-border-brand focus:ring-1 focus:ring-brand transition-colors"
              />
            </div>
          </div>

          <div className="flex border-b border-border-default">
            {TABS.map((tab) => {
              const isDisabled =
                (tab.key === 'district' && !value.province) ||
                (tab.key === 'ward' && !value.district);

              const isActive = activeTab === tab.key;

              const hasValue =
                (tab.key === 'province' && value.province) ||
                (tab.key === 'district' && value.district) ||
                (tab.key === 'ward' && value.ward);

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  disabled={isDisabled}
                  className={`flex-1 px-2 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                    isActive
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : isDisabled
                        ? 'border-transparent text-text-muted/60 cursor-not-allowed'
                        : hasValue
                          ? 'border-transparent text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                          : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                  {hasValue && !isActive && (
                    <Check className="ml-1 inline-block h-3 w-3" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="max-h-[220px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">
                No results found
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
                      selected
                        ? 'text-orange-600 bg-orange-50/60 dark:text-orange-400 dark:bg-orange-500/15 font-medium'
                        : 'text-text-secondary hover:bg-surface-hover'
                    }`}
                  >
                    {item.name}
                    {selected && (
                      <Check className="h-4 w-4 shrink-0 text-orange-500" />
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
