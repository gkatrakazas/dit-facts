// src/components/Legend/SizeLegend.jsx
import React from "react";

export default function SizeLegend({
  title,
  items = [{ size: 12, label: "5" }, { size: 23, label: "50" }, { size: 30, label: "500" }],
  shape = "rect", // "rect" | "circle"
  fill = "#ddd",
  className = "",
}) {
  return (
    <div className={`text-sm border border-gray-300 text-gray-600 shadow-sm px-2 py-2 ${className}`}>
      {title && <div className="mb-1">{title}</div>}
      <div className="flex items-center gap-4">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1">
            <svg width={it.size} height={it.size}>
              {shape === "circle" ? (
                <circle cx={it.size / 2} cy={it.size / 2} r={it.size / 2} fill={fill} />
              ) : (
                <rect width={it.size} height={it.size} fill={fill} />
              )}
            </svg>
            <span className="ml-1">{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
