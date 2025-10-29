import React, { useMemo } from "react";

/**
 * IconLegend (styled like SizeLegend)
 *
 * Props:
 * - items: Array<{ icon: React.ElementType; label: React.ReactNode; color?: string }>
 * - label?: string
 * - direction?: "row" | "column"
 * - gap?: number
 * - iconSize?: number
 * - className?: string
 */
function IconLegend({
  items = [],
  label,
  direction = "column",
  gap = 8,
  iconSize = 18,
  className = "",
}) {
  const containerStyle = useMemo(
    () => ({ display: "flex", flexDirection: direction, gap }),
    [direction, gap]
  );

  return (
    <div
      className={`flex flex-col justify-center items-left gap-2 text-sm border-gray-300 border-[1px] shadow-sm px-2 py-2 ${className}`}
    >
      {label && <div className="text-gray-600">{label}</div>}

      <div style={containerStyle} className="items-start flex-wrap">
        {items.map((it, idx) => {
          const Icon = it.icon;
          return (
            <div
              key={idx}
              className={`flex ${
                direction === "row"
                  ? "flex-col items-center"
                  : "flex-row items-center gap-2"
              }`}
            >
              <Icon
                size={iconSize}
                color={it.color || "#36abcc"}
                className="shrink-0"
              />
              <span className="text-xs text-gray-500 mt-1">{it.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(IconLegend);
