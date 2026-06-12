import { useState, useRef, useEffect } from "react";

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * CurrencyInput — IDR formatted input
 * Shows `Rp 6.000.000` formatted display while typing.
 * Calls onChange with the raw numeric value.
 */
export default function CurrencyInput({
  value,
  onChange,
  placeholder = "Rp 0",
  className = "",
  id,
  disabled = false,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Formatted display (when not focused)
  function formatIDR(n: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  // Raw numeric string while editing (e.g. "6000000")
  const editValue = value !== undefined && value > 0 ? String(value) : "";
  const displayValue = !focused && value !== undefined && value > 0 ? formatIDR(value) : editValue;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Strip everything except digits
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") {
      onChange(undefined);
    } else {
      const num = parseInt(raw, 10);
      onChange(isNaN(num) ? undefined : num);
    }
  }

  function handleFocus() {
    setFocused(true);
    // Delay selection to next tick so value is updated first
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }

  function handleBlur() {
    setFocused(false);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#2F7E79]/40 focus:border-[#2F7E79]/60 transition-all ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}
