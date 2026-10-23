"use client";

import React from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  prefix?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  required = false,
  className = "",
  prefix = "Rp",
}: CurrencyInputProps) {
  // Format angka dengan pemisah ribuan titik (id-ID)
  const displayValue =
    value === 0 || isNaN(value)
      ? ""
      : new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
        }).format(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    const numericVal = rawDigits ? parseInt(rawDigits, 10) : 0;
    onChange(numericVal);
  };

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="numeric"
        required={required && value === 0}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className={`${prefix ? "pl-9 pr-3" : "px-3"} py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full ${className}`}
      />
    </div>
  );
}
