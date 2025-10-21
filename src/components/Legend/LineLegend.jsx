// src/components/Legend/LineLegend.jsx
import React from "react";

export default function LineLegend({ items, className = "" }) {
  // items: Array<{ label: string, color: string }>
  return (
    <div className={`flex flex-col justify-center items-left gap-2 text-sm border-gray-300 border-[1px] shadow-sm px-2 py-2 ${className}`}>
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`} className="flex items-center gap-2">
          <svg width="24" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="24" y2="3" stroke={it.color} strokeWidth="3" />
          </svg>
          <span className="text-xs text-gray-700">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
