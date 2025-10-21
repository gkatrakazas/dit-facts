import React, { useMemo } from "react";
import * as d3 from "d3";

/**
 * Generic size legend (circle or square) driven by a sqrt scale.
 *
 * Props:
 * - shape: "circle" | "rect"
 * - steps: number[]                       // data values to visualize as sizes
 * - domain?: [number, number]             // min/max of the scale; defaults to [steps[0], steps[last]]
 * - range?: [number, number]              // [minSize, maxSize] in px (radius for circle, side for rect)
 * - label?: string                        // title above legend
 * - fill?: string                         // fill color for shapes
 * - stroke?: string                       // stroke color
 * - strokeWidth?: number
 * - direction?: "row" | "column"          // layout direction
 * - gap?: number                          // gap between items (px)
 * - format?: (v:number)=>React.ReactNode  // custom label formatter for step values
 * - className?: string
 */
function SizeLegend({
    shape = "circle",
    steps = [10, 50, 100],
    domain,
    range = [3, 18],
    label,
    fill = "#bbb",
    stroke = "#444",
    strokeWidth = 1,
    direction = "row",
    gap = 16,
    format,
    className = "",
}) {
    const [minSize, maxSize] = range;

    const dDomain = useMemo(
        () => (domain ? domain : [steps[0], steps[steps.length - 1]]),
        [domain, steps]
    );

    // sqrt scale for perceptual sizing
    const sizeScale = useMemo(
        () => d3.scaleSqrt().domain(dDomain).range([minSize, maxSize]),
        [dDomain, minSize, maxSize]
    );

    const containerStyle = useMemo(
        () => ({ display: "flex", flexDirection: direction, gap }),
        [direction, gap]
    );

    return (
        <div className={`flex flex-col gap-1 border border-gray-300 shadow-md p-2 ${className}`}>
            {label && <div className="font-semibold text-xs text-gray-600">{label}</div>}

            <div style={containerStyle} className="items-end flex-wrap">
                {steps.map((value) => {
                    const s = sizeScale(value); // radius (circle) or side (rect)
                    const pad = 8;              // a little breathing room in the SVG
                    const w = shape === "circle" ? s * 2 + pad : s + pad;
                    const h = w;

                    return (
                        <div key={value} className={`flex ${direction === "row" ? "flex-col items-center" : "flex-row items-center gap-2"}`}>
                            <svg width={w} height={h} aria-hidden="true">
                                {shape === "circle" ? (
                                    <circle
                                        cx={w / 2}
                                        cy={h / 2}
                                        r={s}
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                    />
                                ) : (
                                    <rect
                                        x={(w - s) / 2}
                                        y={(h - s) / 2}
                                        width={s}
                                        height={s}
                                        fill={fill}
                                        stroke={stroke}
                                        strokeWidth={strokeWidth}
                                    />
                                )}
                            </svg>
                            <span className="text-xs text-gray-500 mt-1">{format ? format(value) : value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(SizeLegend);
