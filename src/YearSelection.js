import React, { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";

const YearSelection = ({ availableYears, selectedYears, setSelectedYears, onClose, filterType, setFilterType }) => {
  const [range, setRange] = useState({ start: "", end: "" });
  const [tempSelectedYears, setTempSelectedYears] = useState([]);
  const [selectionMode, setSelectionMode] = useState(filterType);

  // Sync selected years when popup opens
  useEffect(() => {
    if (selectionMode === "multi") {
      setTempSelectedYears(selectedYears);
    } else if (selectionMode === "range" && selectedYears.length) {
      setRange({ start: selectedYears[0], end: selectedYears[selectedYears.length - 1] });
    }
  }, [selectionMode, selectedYears]);

  // Clear selections when switching mode
  const handleModeChange = (mode) => {
    setSelectionMode(mode);
    setTempSelectedYears(selectedYears);
    if (mode === "range" && selectedYears.length) {
      setRange({ start: selectedYears[0], end: selectedYears[selectedYears.length - 1] });
    } else {
      setRange({ start: "", end: "" });
    }
  };

  // Ensure valid year range selection
  const handleRangeChange = (type, value) => {
    if (type === "start") {
      setRange((prev) => ({
        start: value,
        end: prev.end && value > prev.end ? "" : prev.end,
      }));
    } else {
      setRange((prev) => ({
        start: prev.start,
        end: value,
      }));
    }
  };

  // Apply filter logic
  const applyFilter = () => {
    if (selectionMode === "multi") {
      setSelectedYears([...tempSelectedYears]); // Ensure new array reference
    } else if (selectionMode === "range" && range.start && range.end) {
      const filteredYears = availableYears.filter(
        (year) => year >= range.start && year <= range.end
      );
      setSelectedYears([...filteredYears]); // Ensure new array reference
    }
    setFilterType(selectionMode);
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 ${selectionMode === "multi" ? "text-blue-500 border-blue-500 border-b-2" : "text-gray-500"}`}
          onClick={() => handleModeChange("multi")}
        >
          Multi-Select
        </button>
        <button
          className={`flex-1 py-2 ${selectionMode === "range" ? "text-blue-500 border-blue-500 border-b-2" : "text-gray-500"}`}
          onClick={() => handleModeChange("range")}
        >
          Year Range
        </button>
      </div>

      {/* Multi-Select Years */}
      {selectionMode === "multi" && (
        <div>
          <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto border p-2 rounded">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() =>
                  setTempSelectedYears((prev) =>
                    prev.includes(year)
                      ? prev.filter((y) => y !== year)
                      : [...prev, year]
                  )
                }
                className={`px-3 py-1 border rounded text-xs w-14 ${tempSelectedYears.includes(year)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
                  }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Year Range Selection */}
      {selectionMode === "range" && (
        <div>
          <div className="flex gap-2 mt-2 items-center relative">
            {/* Start Year Dropdown */}
            <select
              value={range.start}
              onChange={(e) => handleRangeChange("start", Number(e.target.value))}
              className="border p-2 rounded w-full"
            >
              <option value="">Start Year</option>
              {availableYears.map((year) => (
                <option key={year} value={year} disabled={range.end && year > range.end}>
                  {year}
                </option>
              ))}
            </select>

            {/* End Year Dropdown */}
            <select
              value={range.end}
              onChange={(e) => handleRangeChange("end", Number(e.target.value))}
              className="border p-2 rounded w-full"
            >
              <option value="">End Year</option>
              {availableYears
                .filter((year) => !range.start || year >= range.start)
                .map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>

            {/* Clear Button - Reset Start & End Years */}
            {(range.start || range.end) && (
              <button
                onClick={() => setRange({ start: "", end: "" })}
                className="bg-gray-200 hover:bg-gray-300 rounded p-2.5"
                title="Clear Range"
              >
                <IoMdClose />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Apply Filter Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="w-24 mt-4 bg-gray-400 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
        <button
          onClick={applyFilter}
          className="w-24 mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default YearSelection;
