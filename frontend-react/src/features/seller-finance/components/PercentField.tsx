import { useState } from 'react';

interface Props {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  id?: string;
  className?: string;
}

/**
 * Number input for a percentage. At rest it shows two decimals (e.g. "10.00")
 * so the value reads like a real percentage, but while focused it stays freely
 * editable and keeps the native spinner. Emits `undefined` when cleared.
 */
export function PercentField({
  value,
  onChange,
  onBlur,
  min = 0,
  max = 100,
  id,
  className = 'admin-input',
}: Props) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const isEmpty = value === undefined || Number.isNaN(value);
  const display = focused ? draft : isEmpty ? '' : Number(value).toFixed(2);

  return (
    <input
      id={id}
      type="number"
      step="any"
      min={min}
      max={max}
      value={display}
      onFocus={() => {
        setDraft(isEmpty ? '' : String(value));
        setFocused(true);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value === '' ? undefined : Number(e.target.value));
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      className={className}
    />
  );
}
