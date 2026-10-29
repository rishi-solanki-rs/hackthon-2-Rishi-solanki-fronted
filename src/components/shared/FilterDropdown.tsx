import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Value that means "no filter"; the button is highlighted when the value differs. */
  defaultValue?: string;
  align?: 'left' | 'right';
}

/** Compact filter button with a single-choice popover menu (keyboard and screen-reader friendly). */
export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, value, options, onChange, defaultValue = 'all', align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuId = useId();
  const active = value !== defaultValue;
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    listRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"], button')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const moveFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('button') || []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors focus-ring ${
          active ? 'bg-ink text-canvas border-ink' : 'bg-surface border-surface-border text-ink hover:border-evergreen/40'
        }`}
      >
        <span className={active ? 'opacity-70' : 'text-ink-muted'}>{label}</span>
        {active && current && <span className="font-semibold">{current.label}</span>}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul
          id={menuId}
          ref={listRef}
          role="menu"
          aria-label={label}
          onKeyDown={moveFocus}
          className={`absolute z-40 mt-1.5 min-w-[200px] max-h-80 overflow-y-auto p-1 bg-surface border border-surface-border rounded-2xl shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left focus:outline-none focus-visible:bg-surface-secondary hover:bg-surface-secondary ${
                    selected ? 'text-evergreen font-semibold' : 'text-ink'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
                  <span className="flex-1">{o.label}</span>
                  {o.count !== undefined && <span className="text-xs text-ink-subtle tabular-nums">{o.count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
