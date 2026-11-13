"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";

/** محدِّد متعدد (تصنيفات / وسوم) مع اقتراحات من القيم المستخدمة سابقاً وإمكانية إضافة قيمة جديدة */
export default function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  max = 20,
  ariaLabel,
  invalid,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  max?: number;
  ariaLabel: string;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);
  const q = query.trim();
  const options = useMemo(() => {
    const filtered = suggestions.filter(
      (s) => !selected.has(s.toLowerCase()) && (!q || s.toLowerCase().includes(q.toLowerCase())),
    );
    const exact = suggestions.some((s) => s.toLowerCase() === q.toLowerCase());
    const list = filtered.slice(0, 8).map((label) => ({ label, isNew: false }));
    if (q && !exact && !selected.has(q.toLowerCase())) list.push({ label: q, isNew: true });
    return list;
  }, [suggestions, selected, q]);

  const add = (raw: string) => {
    const label = raw.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!label || selected.has(label.toLowerCase()) || value.length >= max) return;
    onChange([...value, label]);
    setQuery("");
    setActive(0);
  };
  const remove = (label: string) => onChange(value.filter((v) => v !== label));

  return (
    <div className="relative">
      <div
        className={clsx(
          "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15",
          invalid ? "border-rose-400" : "border-slate-300",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((v) => (
          <span
            key={v}
            dir="auto"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 py-1 pl-1 pr-2.5 text-xs font-bold text-emerald-900 ring-1 ring-inset ring-emerald-200"
          >
            {v}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(v);
              }}
              aria-label={`إزالة ${v}`}
              className="flex h-5 w-5 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          dir="auto"
          value={query}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (open && options[active]) add(options[active].label);
              else add(query);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Backspace" && !query && value.length) {
              remove(value[value.length - 1]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="min-w-[120px] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.label + String(o.isNew)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                add(o.label);
              }}
              onMouseEnter={() => setActive(i)}
              className={clsx(
                "cursor-pointer rounded-lg px-3 py-2 text-sm",
                i === active ? "bg-emerald-50 text-emerald-900" : "text-slate-700",
              )}
            >
              {o.isNew ? (
                <span>
                  إضافة «<span dir="auto" className="font-bold">{o.label}</span>»
                </span>
              ) : (
                <span dir="auto">{o.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
