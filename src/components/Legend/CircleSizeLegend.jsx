// src/components/Legend/CircleSizeLegend.jsx
import React, { useMemo } from "react";
import * as d3 from "d3";

export default function CircleSizeLegend({
  steps = [10, 50, 100],
  domain,               // [min,max] (optional)
  range = [3, 18],      // [minR, maxR]
  label,
  fill = "#bbb",
  stroke = "#444",
  className = "",
}) {
  const [minR, maxR] = range;
  const dDomain = useMemo(
    () => domain ?? [steps[0], steps[steps.length - 1]],
    [domain, steps]
  );
  const scale = useMemo(
    () => d3.scaleSqrt().domain(dDomain).range([minR, maxR]),
    [dDomain, minR, maxR]
  );

  return (
    <div className={`flex flex-col gap-1 border border-gray-300 shadow-md p-2 ${className}`}>
      {label && <div className="font-semibold text-xs text-gray-600">{label}</div>}
      <div className="flex flex-row gap-4 items-end">
        {steps.map((count) => {
          const r = scale(count);
          const size = r * 2 + 8;
          return (
            <div key={count} className="flex flex-col items-center">
              <svg width={size} height={size}>
                <circle cx={r + 4} cy={r + 4} r={r} fill={fill} stroke={stroke} />
              </svg>
              <span className="text-xs text-gray-500 mt-1">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
