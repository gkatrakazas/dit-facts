import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

function CheckboxFilter({
    title,
    options,
    selected,
    onChange,
    descriptions = {},
    getOptionLabel,
    className = "",
    maxHeight = 176,
    allLabel,
}) {
    const { t } = useTranslation();

    // Stable arrays for callbacks (fixes react-hooks/exhaustive-deps warnings)
    const all = useMemo(() => options ?? [], [options]);
    const sel = useMemo(() => selected ?? [], [selected]);

    const allSelected = useMemo(() => sel.length === all.length && all.length > 0, [sel.length, all.length]);
    const noneSelected = useMemo(() => sel.length === 0, [sel.length]);
    const isIndeterminate = useMemo(() => !allSelected && !noneSelected, [allSelected, noneSelected]);

    const allRef = useRef(null);
    useEffect(() => {
        if (allRef.current) allRef.current.indeterminate = isIndeterminate;
    }, [isIndeterminate]);

    const toggleAll = useCallback(
        (checked) => {
            onChange?.(checked ? all : []);
        },
        [all, onChange]
    );

    const toggleOne = useCallback(
        (option) => {
            onChange?.(sel.includes(option) ? sel.filter((o) => o !== option) : [...sel, option]);
        },
        [sel, onChange]
    );

    const labelFor = useCallback(
        (option) => (getOptionLabel ? getOptionLabel(option) : option),
        [getOptionLabel]
    );

    const containerStyle = useMemo(() => ({ maxHeight }), [maxHeight]);

    // Single encoded SVG string so we don’t re-create it inline everywhere
    const checkSvgBg = useMemo(
        () =>
            `url("data:image/svg+xml,${encodeURIComponent(
                '<svg viewBox="0 0 20 20" fill="white" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.292 7.292a1 1 0 01-1.42 0L3.296 9.29a1 1 0 011.408-1.42L8 11.172l6.296-6.296a1 1 0 011.408 0z"/></svg>'
            )}")`,
        []
    );

    return (
        <div className={className}>
            {title && <label className="block text-sm font-medium text-gray-700 mb-1">{title}</label>}

            <div
                className="space-y-1 overflow-y-auto border border-gray-300 rounded-md text-sm bg-white"
                style={containerStyle}
                role="group"
                aria-label={typeof title === "string" ? title : undefined}
            >
                {/* Select all */}
                <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                    <input
                        ref={allRef}
                        type="checkbox"
                        className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
                       checked:bg-[#36abcc] checked:border-[#36abcc] focus:outline-none"
                        style={{
                            backgroundImage: checkSvgBg,
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "1rem",
                        }}
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                        aria-checked={allSelected ? "true" : isIndeterminate ? "mixed" : "false"}
                    />
                    <span className="text-gray-800 font-medium">{allLabel ?? t("visualization.common.all")}</span>
                </label>

                <div className="border-t border-gray-200 my-1" />

                {/* Items */}
                {all.map((option) => {
                    const checked = sel.includes(option);
                    const display = labelFor(option);
                    const desc = descriptions[option];

                    return (
                        <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                            <input
                                type="checkbox"
                                className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
                           checked:bg-[#36abcc] checked:border-[#36abcc] focus:outline-none"
                                style={{
                                    backgroundImage: checkSvgBg,
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "1rem",
                                }}
                                checked={checked}
                                onChange={() => toggleOne(option)}
                            />
                            <span
                                className="text-gray-800 text-sm whitespace-nowrap"
                                title={desc ? `${display} - ${desc}` : display}
                            >
                                {display}
                                {desc ? ` - ${desc}` : ""}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

export default React.memo(CheckboxFilter);
