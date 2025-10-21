// src/components/Legend/GradientLegend.jsx
import React, { useId } from "react";

export default function GradientLegend({
  title,
  startLabel,
  endLabel,
  startColor,
  endColor,
  width = 140,
  height = 12,
  className = "",
}) {
  const id = useId(); // unique gradient id per instance
  return (
    <div className={`text-sm border border-gray-300 text-gray-600 shadow-sm px-2 py-2 ${className}`}>
      {title && <div className="mb-1">{title}</div>}
      <div className="flex items-center gap-2">
        {startLabel != null && <span className="text-gray-600">{startLabel}</span>}
        <svg width={width} height={height}>
          <defs>
            <linearGradient id={`legend-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill={`url(#legend-gradient-${id})`} />
        </svg>
        {endLabel != null && <span className="text-gray-600">{endLabel}</span>}
      </div>
    </div>
  );
}
