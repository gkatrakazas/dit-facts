import React from "react";

export default function SegmentedControl({
    value,
    onChange,
    options, // [{value, label}]
    className = "",
}) {
    return (
        <div className={`flex border border-gray-300 rounded overflow-hidden ${className}`}>
            {options.map((opt) => {
                const active = value === opt.value;
                return (
                    <label
                        key={opt.value}
                        className={`w-full text-center px-3 py-2 cursor-pointer transition-all duration-200
                        ${active ? "bg-secondary text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                    >
                        <input
                            type="radio"
                            className="hidden"
                            name="segmented"
                            value={opt.value}
                            checked={active}
                            onChange={() => onChange(opt.value)}
                        />
                        {opt.label}
                    </label>
                );
            })}
        </div>
    );
}
