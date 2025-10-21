import React from "react";

export default function ColorDotLegend({ title, levels, note, className = "" }) {
  return (
    <div className={`flex flex-col justify-center items-left gap-2 text-sm border-gray-300 border-[1px] shadow-sm px-2 py-2 ${className}`}>
      {title && <span className="text-gray-600">{title}</span>}
      <div className="flex flex-wrap gap-2 mt-2 text-xs w-full">
        {levels.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 border p-1 bg-gray-50">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
      {note && <p className="font-medium mb-1 italic text-xs text-gray-600">{note}</p>}
    </div>
  );
}
