import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "../../data/di_stats.xlsx";
import { useTranslation } from "react-i18next";
import MultiRangeSlider from "../../components/MultiRangeSlider";
import { usePagination } from "../../hooks/usePagination";
import PaginationControls from "../../components/PaginationControls";
import { admissionTypeDescriptions, admissionTypeGroups, statusDescriptions } from "../../data/students/studentMetadata";

const inactivityLevels = [
  { min: 20, color: "#8B0000", label: "> 20" },
  { min: 10, color: "#FF4500", label: "10–20" },
  { min: 5, color: "#FFA500", label: "5–10" },
  { min: 2, color: "#FFD700", label: "2–5" },
  { min: 0, color: "#32CD32", label: "< 2" },
];

// const speedLevels = useMemo(() => ([
//   { max: 4,        color: "#28a428", label: t("visualization.graduatesDuration.bins.uptoN")   },
//   { max: 5,        color: "#9ACD32", label: t("visualization.graduatesDuration.bins.nToN1")   },
//   { max: 6,        color: "#FFD700", label: t("visualization.graduatesDuration.bins.n1ToN2")  },
//   { max: Infinity, color: "#FF4500", label: t("visualization.graduatesDuration.bins.gtN2")    }
// ]), [t]);


// const getColorBySpeed = (yearsToDegree) => (speedLevels.find(l => yearsToDegree <= l.max)?.color ?? "#525252");
// const getSpeedCategory = (yearsToDegree) => (speedLevels.find(l => yearsToDegree <= l.max)?.label ?? "-");

// Utils
const formatYearsAndMonths = (yearsDecimal) => {
  const fullYears = Math.floor(yearsDecimal);
  const months = Math.round((yearsDecimal - fullYears) * 12);

  const yearLabel = fullYears === 1 ? "έτος" : "έτη";
  const monthLabel = months === 1 ? "μήνα" : "μήνες";

  if (fullYears > 0 && months > 0) {
    return `${fullYears} ${yearLabel} και ${months} ${monthLabel}`;
  } else if (fullYears > 0) {
    return `${fullYears} ${yearLabel}`;
  } else {
    return `${months} ${monthLabel}`;
  }
};

const formatDateToYearMonth = (date) => {
  const d = new Date(date);
  if (isNaN(d)) return "-";
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};



const getTooltipHtml = ((d, t) => {
  const fieldsToShow = [
    { label: t("visualization.graduatesDuration.details.admissionYear"), value: d.data.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] },
    { label: t("visualization.common.year"), value: d.data.gradYear },
    { label: t("visualization.graduatesDuration.details.lastAction"), value: formatDateToYearMonth(d.data.gradDate) },
    { label: t("visualization.common.admissionType"), value: d.data.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"] },
    { label: t("visualization.graduatesDuration.details.status"), value: d.data.raw?.["ΚΑΤΑΣΤΑΣΗ"] },
    { label: t("visualization.graduatesDuration.details.timeToDegree"), value: formatYearsAndMonths(d.data.size) },
    { label: t("visualization.graduatesDuration.details.passedCourses"), value: d.data.r },
    { label: t("visualization.inactiveStudents.tooltip.lastActionDate"), value: formatDateToYearMonth(d.data.lastAction) }
  ];
  return fieldsToShow
    .map(({ label, value }) => `<b>${label}:</b> ${value ?? "-"}`)
    .join("<br/>");
});


const CheckboxFilter = ({ title, options, selected, setSelected, descriptions = {}, t }) => {
  const allSelected = selected.length === options.length;

  const toggleAll = (checked) => {
    setSelected(checked ? options : []);
  };

  const toggleOne = (option) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
      </label>
      <div className="space-y-1 max-h-44 overflow-y-auto border border-gray-300 rounded-md text-sm bg-white">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
          <input
            type="checkbox"
            className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
            checked:bg-[#36abcc] checked:border-[#36abcc]
            flex items-center justify-center
            focus:outline-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16.704 5.29a1 1 0 010 1.42l-7.292 7.292a1 1 0 01-1.42 0L3.296 9.29a1 1 0 011.408-1.42L8 11.172l6.296-6.296a1 1 0 011.408 0z'/%3E%3C/svg%3E")`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1rem'
            }}
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
          />
          <span className="text-gray-800 font-medium">{t('visualization.common.all')}</span>
        </label>
        <div className="border-t border-gray-200 my-1" />
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <input
              type="checkbox"
              className="appearance-none h-4 w-4 shrink-0 rounded bg-white border border-gray-300
              checked:bg-[#36abcc] checked:border-[#36abcc]
              flex items-center justify-center
              focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16.704 5.29a1 1 0 010 1.42l-7.292 7.292a1 1 0 01-1.42 0L3.296 9.29a1 1 0 011.408-1.42L8 11.172l6.296-6.296a1 1 0 011.408 0z'/%3E%3C/svg%3E")`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1rem'
              }}
              checked={selected.includes(option)}
              onChange={() => toggleOne(option)}
            />
            <span
              className="text-gray-800 text-sm whitespace-nowrap"
              title={`${option} - ${descriptions[option] ?? option}`}
            >
              {option} {descriptions[option] && `- ${descriptions[option]}`}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};


function filterStudents({
  data,
  selectedYears,
  courseRange,
  selectedAdmissionTypes,
  selectedAdmissionGroups,
}) {
  return data.filter(b =>
    selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
    b.r >= courseRange.start &&
    b.r <= courseRange.end &&
    selectedAdmissionTypes.includes(b.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]) &&
    selectedAdmissionGroups.includes(b.admissionGroup)
  );
}

// Main Component
const GraduatesDuration = () => {
  const { t } = useTranslation();

  // States
  const [rawData, setRawData] = useState([]);
  const [showRawData, setShowRawData] = useState(false);

  const [showFullDetails, setShowFullDetails] = useState(false);

  const speedLevels = useMemo(() => ([
    { max: 4, color: "#28a428", label: t("visualization.graduatesDuration.bins.uptoN") },
    { max: 5, color: "#9ACD32", label: t("visualization.graduatesDuration.bins.nToN1") },
    { max: 6, color: "#FFD700", label: t("visualization.graduatesDuration.bins.n1ToN2") },
    { max: Infinity, color: "#FF4500", label: t("visualization.graduatesDuration.bins.gtN2") }
  ]), [t]);

  const getColorBySpeed = useCallback(
    (yearsToDegree) => (speedLevels.find(l => yearsToDegree <= l.max)?.color ?? "#525252"),
    [speedLevels]
  );

  const getSpeedCategory = useCallback(
    (yearsToDegree) => (speedLevels.find(l => yearsToDegree <= l.max)?.label ?? "-"),
    [speedLevels]
  );

  const {
    currentPage,
    totalPages,
    currentData,
    nextPage,
    prevPage,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination(rawData, 100);

  const [inactiveBubbleData, setInactiveBubbleData] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);

  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  const [courseRange, setCourseRange] = useState({ start: null, end: null });
  const [availableCourses, setAvailableCourses] = useState([]);

  const [admissionTypes, setAdmissionTypes] = useState([]);
  const [selectedAdmissionTypes, setSelectedAdmissionTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const [viewMode, setViewMode] = useState("individual");
  const [groupedMode, setGroupedMode] = useState("byYear");

  const [filterMode, setFilterMode] = useState('hide');

  const [admissionGroups, setAdmissionGroups] = useState([]);
  const [selectedAdmissionGroups, setSelectedAdmissionGroups] = useState([]);

  // Refs for D3 containers
  const packedRef = useRef(null);
  const containerRef = useRef(null);

  const yearPackedRef = useRef(null);
  const yearContainerRef = useRef(null);

  const categoryPackedRef = useRef(null);
  const categoryContainerRef = useRef(null);

  const admissionPackedRef = useRef(null);
  const admissionContainerRef = useRef(null);

  const statusPackedRef = useRef(null);
  const statusContainerRef = useRef(null);

  const durationContainerRef = useRef(null);
  const durationPackedRef = useRef(null);

  const admissionGroupContainerRef = useRef(null);
  const admissionGroupPackedRef = useRef(null);

  const categoryBarRef = useRef(null);
  const [barChartWidth, setBarChartWidth] = useState(0);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Grouping Config
  const groupOptions = [
    {
      key: "byYear",
      label: "Ανά έτος εγγραφής",
      groupBy: (d) => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"],
      labelKey: "year",
      getLabel: (d) => d.data.year,
      containerRef: yearContainerRef,
      packedRef: yearPackedRef,
    },
    {
      key: "byCategory",
      label: "Ανά διάρκεια φοίτησης",
      groupBy: (d) => getSpeedCategory(d.size),
      labelKey: "category",
      getLabel: (d) => d.data.category,
      containerRef: categoryContainerRef,
      packedRef: categoryPackedRef,
    },
    {
      key: "byAdmissionGroup",
      label: "Ανά κατηγορία τρόπου εισαγωγής",
      groupBy: (d) => d.admissionGroup,
      labelKey: "admissionGroup",
      getLabel: (d) => d.data.admissionGroup,
      containerRef: admissionGroupContainerRef,
      packedRef: admissionGroupPackedRef,
    },
    {
      key: "byAdmissionType",
      label: "Ανά τρόπο εισαγωγής",
      groupBy: (d) => d.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"],
      labelKey: "admissionType",
      getLabel: (d) => d.data.admissionType,
      containerRef: admissionContainerRef,
      packedRef: admissionPackedRef,
    },
    // {
    //   key: "byStudyDuration",
    //   label: "Ανά διάρκεια φοίτησης",
    //   groupBy: (d) => {
    //     const enrollmentYear = d.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
    //     const maxDataYear = Math.max(...availableYears); // from state
    //     const yearsStudied = maxDataYear - enrollmentYear;
    //     const n = 4;

    //     if (yearsStudied <= n) return `0 εώς και ν`;
    //     if (yearsStudied === n + 1) return `ν εώς και ν+1`;
    //     if (yearsStudied === n + 2) return `ν+1 εώς και ν+2`;
    //     return `>ν+2`;
    //   },
    //   labelKey: "durationCategory",
    //   getLabel: (d) => d.data.durationCategory,
    //   containerRef: durationContainerRef,
    //   packedRef: durationPackedRef,
    // }

  ];

  const displayedAdmissions = selectedAdmissionTypes.length > 5 && !showFullDetails
    ? `${selectedAdmissionTypes.slice(0, 5).join(", ")}... και άλλοι ${selectedAdmissionTypes.length - 5}`
    : selectedAdmissionTypes.join(", ");

  const groupedModeConfig = Object.fromEntries(groupOptions.map((opt) => [opt.key, opt]));

  useEffect(() => {
    const el = categoryBarRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        setBarChartWidth(newWidth);
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    console.log('availableYears', availableYears)
    if (availableYears.length > 0) {
      setMinYear(Math.min(...availableYears));
      setMaxYear(Math.max(...availableYears));
    }
  }, [availableYears])

  useEffect(() => {
    const observeTarget =
      viewMode === "individual"
        ? containerRef.current
        : (viewMode === "grouped" && groupedMode === "byYear")
          ? yearContainerRef.current
          : (viewMode === "grouped" && groupedMode === "byCategory")
            ? categoryContainerRef.current
            : null;

    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => observeTarget && resizeObserver.unobserve(observeTarget);
  }, [viewMode, groupedMode]);

  useEffect(() => {
    const graphEl = document.getElementById("graph");

    const handleClick = (event) => {
      if (!graphEl) return;

      // Only clear if the click was *directly* on the #graph element
      if (event.target === graphEl) {
        setSelectedBubble(null);
      }
    };

    graphEl?.addEventListener("mousedown", handleClick);
    return () => {
      graphEl?.removeEventListener("mousedown", handleClick);
    };
  }, []);

  useEffect(() => {
    setSelectedBubble(null);
  }, [selectedYears, courseRange]);

  useEffect(() => {
    if (range.start !== null && range.end !== null) {
      const filtered = availableYears.filter(
        (y) => y >= range.start && y <= range.end
      );
      setSelectedYears(filtered);
    }
  }, [range, availableYears]);

  useEffect(() => {
    const loadExcelData = async () => {
      const response = await fetch(excelFile);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setRawData(sheetData);

      const today = new Date();

      console.log(sheetData);
      // 🔽 Add this to log 2024 students


      const graduated = sheetData.filter(row => !!row["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"]); // keep only graduates


      const bubbles = graduated.map(row => {
        const enrollYear = row["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];                   // number (e.g., 2016)
        // assume academic year starts Sep 1
        const enrollDate = new Date(`${enrollYear}-09-01`);

        // prefer exact graduation date if you have it; else default to June 30 of grad year
        const gradYear = row["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"];
        console.log('gradYear', gradYear)
        const gradDate = new Date(`${gradYear}-12-31`);; // if exists, e.g. '2023-02-15'
        const yearsToDegree = Math.floor(
          ((gradDate - enrollDate) / (1000 * 60 * 60 * 24 * 365.25) + 1)
        );
        const admissionCode = row["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"];
        const admissionGroup = admissionTypeGroups[admissionCode] || "Άλλο";

        return {
          r: row["ΠΛΗΘΟΣ ΜΑΘΗΜΑΤΩΝ"] || 0,
          size: yearsToDegree,              // ⟵ now "speed" (time-to-degree)
          gradYear,
          gradDate,
          lastAction: gradDate.toISOString().slice(0, 10), // reused for sorting/tooltip positioning
          admissionGroup,
          raw: row
        };
      }).filter(d => !isNaN(d.gradDate));

      setRawData(sheetData);
      setInactiveBubbleData(bubbles);

      const years = [...new Set(bubbles.map(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]))].sort((a, b) => a - b);
      setAvailableYears(years);
      setSelectedYears(years); // Default to all years visible

      setRange({
        start: Math.min(...years),
        end: Math.max(...years),
      });

      const admissions = [...new Set(bubbles.map(b => b.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]).filter(Boolean))];
      setAdmissionTypes(admissions);
      setSelectedAdmissionTypes(admissions); // default: all selected

      const uniqueAdmissionGroups = [...new Set(bubbles.map(b => b.admissionGroup))];
      setAdmissionGroups(uniqueAdmissionGroups);
      setSelectedAdmissionGroups(uniqueAdmissionGroups); // default: all selected

      const courses = [...new Set(bubbles.map(b => b.r))].sort((a, b) => a - b);
      setAvailableCourses(courses);

      setCourseRange({
        start: Math.min(...courses),
        end: Math.max(...courses),
      });

    };

    loadExcelData();
  }, []);

  useEffect(() => {
    const isVisible = (student) =>
      filterStudents({
        data: [student],
        selectedYears,
        courseRange,
        selectedAdmissionTypes,
        selectedAdmissionGroups,
      }).length > 0;

    const visibleData = filterMode === 'hide'
      ? inactiveBubbleData.filter(isVisible)
      : inactiveBubbleData;

    if (viewMode !== "individual") return;

    const fallbackSize = 800;
    const width = dimensions.width || fallbackSize;
    const height = dimensions.height || fallbackSize;

    if (!width || !height || !packedRef.current) return;

    d3.select(packedRef.current).selectAll("*").remove();


    const svg = d3
      .select(packedRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")


    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .on("click", () => {
        setSelectedBubble(null); // Clear when background is clicked
      });

    if (!visibleData.length) return; // ✅ draw empty chart only

    const tooltip = d3.select("#bubble-tooltip");

    const sortedData = [...visibleData].sort(
      (a, b) => new Date(a.size) - new Date(b.size)
    );

    const root = d3.hierarchy({ children: sortedData }).sum(d => d.value || 0.5);

    const padding = 1.5;

    const pack = d3.pack()
      .size([width, height])
      .padding(padding);

    const defs = svg.append("defs");

    const filter = defs.append("filter")
      .attr("id", "hover-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");

    filter.append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 0)
      .attr("stdDeviation", 3)
      .attr("flood-color", "#000")
      .attr("flood-opacity", 0.3);



    pack(root);
    // const scaleX = 1.5;
    // root.descendants().forEach(d => {
    //   d.x = (d.x - width / 2) * scaleX + width / 2;
    // });


    svg
      .selectAll("circle")
      .data(root.leaves())
      .join("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.r)
      .attr("fill", d => getColorBySpeed(d.data.size))
      .attr("opacity", (d) => {
        const isMatch = isVisible(d.data);
        const isSelected = selectedBubble && d.data === selectedBubble;

        if (selectedBubble) {
          return isSelected ? 1 : (isMatch ? 0.35 : 0.1);
        }

        if (filterMode === 'dim') {
          return isMatch ? 1 : 0.1;
        }

        return 1;
      })
      .attr("stroke", "#222")
      .attr("stroke-width", 0.3)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("filter", "url(#hover-shadow)");

        tooltip
          .style("opacity", 1)
          .html(getTooltipHtml(d, t));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX + 0}px`)
          .style("top", `${event.clientY + 0}px`);
      })
      .attr("pointer-events", (d) => {
        const match = isVisible(d.data);
        return filterMode === 'dim' && !match ? "none" : "auto";
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(0)
          .attr("filter", null)
          .attr("opacity", () => {
            const isSelected =
              selectedBubble &&
              d.data === selectedBubble

            return selectedBubble ? (isSelected ? 1 : 0.35) : 1;
          });

        tooltip.style("opacity", 0);
      })

      .on("click", (_, d) => {
        setSelectedBubble(d.data); // 🟢 Store data for details panel
      });
  }, [inactiveBubbleData, viewMode, groupedMode, dimensions, selectedYears, selectedAdmissionTypes, courseRange, selectedBubble, filterMode, selectedAdmissionGroups]);

  const renderGroupedBubbles = useCallback((configKey) => {
    const config = groupedModeConfig[configKey];
    if (!config || !inactiveBubbleData.length || !dimensions.width || !config.packedRef.current) return;

    const isVisible = (student) =>
      filterStudents({
        data: [student],
        selectedYears,
        courseRange,
        selectedAdmissionTypes,
        selectedAdmissionGroups,
      }).length > 0;

    const filtered =
      filterMode === "hide"
        ? inactiveBubbleData.filter(isVisible)
        : inactiveBubbleData;

    d3.select(config.packedRef.current).selectAll("*").remove();
    const svg = d3
      .select(config.packedRef.current)
      .append("svg")
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("width", "100%")
      .attr("height", dimensions.height);

    svg.append("rect")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .attr("fill", "transparent")
      .on("click", () => setSelectedBubble(null));

    if (!filtered.length) return; // 🟢 Still shows empty chart container

    const grouped = d3.group(filtered, config.groupBy);
    const hierarchy = {
      children: [...grouped.entries()].map(([key, items]) => ({
        [config.labelKey]: key,
        children: [...items]
          .sort((a, b) => new Date(a.size) - new Date(b.size))
          .map((s) => ({ ...s, value: 1 })),
      })),
    };

    const root = d3
      .hierarchy(hierarchy)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    // Define margins
    const margin = { top: 10, right: 0, bottom: 0, left: 0 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    d3.pack()
      .size([innerWidth, innerHeight])
      .padding(3)(root);

    // Shift root coordinates to account for margin
    root.descendants().forEach((d) => {
      d.x += margin.left;
      d.y += margin.top;
    });


    root.children.forEach((group) => {
      group.r *= 0.9;
      group.children.forEach((child) => {
        const dx = child.x - group.x;
        const dy = child.y - group.y;
        const scale = 0.9;
        child.x = group.x + dx * scale;
        child.y = group.y + dy * scale;
      });
    });

    const tooltip = d3.select("#bubble-tooltip");

    svg
      .selectAll("circle.parent")
      .data(root.children)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r + 3)
      .attr("fill", "#F9F9F9")
      .attr("stroke", "#ccc")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<b>${config.labelKey}:</b> ${config.getLabel(d)}<br/><b>Φοιτητές/τριες:</b> ${d.children?.length ?? 0}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    svg
      .selectAll("circle.student")
      .data(root.leaves())
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => getColorBySpeed(d.data.size))
      .attr("opacity", (d) => {
        const isMatch = isVisible(d.data);
        const isSelected = selectedBubble && d.data === selectedBubble;

        if (selectedBubble) {
          return isSelected ? 1 : (isMatch ? 0.35 : 0.1);
        }

        if (filterMode === 'dim') {
          return isMatch ? 1 : 0.1;
        }

        return 1;
      })
      .attr("pointer-events", (d) => {
        const match = isVisible(d.data);
        return filterMode === 'dim' && !match ? "none" : "auto";
      })
      .attr("stroke", "#1E3A8A")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("filter", "url(#hover-shadow)")
          .attr("opacity", 1);

        tooltip.style("opacity", 1).html(getTooltipHtml(d, t));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(0)
          .attr("filter", null)
          .attr("opacity", () =>
            selectedBubble && d.data.raw !== selectedBubble.raw ? 0.35 : 1
          );
        tooltip.style("opacity", 0);
      })
      .on("click", (_, d) => setSelectedBubble(d.data));

    svg
      .selectAll("text.label")
      .data(root.children)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - d.r)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => `${Math.max(8, d.r / 5)}px`)
      .attr("font-weight", "bold")
      .attr("fill", "#444")
      .style("paint-order", "stroke")
      .text(config.getLabel)
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(
            `<b>${t(`visualization.graduatesDuration.group.${config.key}`)}:</b> ${config.getLabel(d)}<br/>
             <b>${t("visualization.graduatesDuration.summary.count", { count: d.children?.length ?? 0 })}</b>`
          )
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

  }, [groupedModeConfig, inactiveBubbleData, dimensions, selectedYears, courseRange, selectedAdmissionTypes, selectedBubble, filterMode, selectedAdmissionGroups]);

  useEffect(() => {
    if (viewMode === "grouped") {
      renderGroupedBubbles(groupedMode);
    }
  }, [viewMode, groupedMode, inactiveBubbleData, dimensions, selectedYears, courseRange, selectedBubble, selectedAdmissionTypes, renderGroupedBubbles]);

  useEffect(() => {
    if (!inactiveBubbleData.length || !categoryBarRef.current) return;

    const filtered = filterStudents({
      data: inactiveBubbleData,
      selectedYears,
      courseRange,
      selectedAdmissionTypes,
      selectedAdmissionGroups,
    });

    const categoryCounts = d3.rollups(
      filtered,
      v => v.length,
      d => getSpeedCategory(d.size)
    );

    console.log('categoryCounts', categoryCounts)
    categoryCounts.sort(
      (a, b) =>
        speedLevels.findIndex(l => l.label === a[0]) -
        speedLevels.findIndex(l => l.label === b[0])
    );
    const container = d3.select(categoryBarRef.current);
    container.selectAll("*").remove();

    const width = barChartWidth;
    const height = 200;
    const margin = { top: 10, right: 35, bottom: 40, left: 75 };

    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    const x = d3.scaleLinear()
      .domain([0, d3.max(categoryCounts, d => d[1]) || 1])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(categoryCounts.map(d => d[0]))
      .range([margin.top, height - margin.bottom])
      .padding(0.35);

    const colorByLabel = speedLevels.reduce((acc, lvl) => {
      acc[lvl.label] = lvl.color;
      return acc;
    }, {});

    const tooltip = d3.select("#bubble-tooltip");

    // Bars
    svg.append("g")
      .selectAll("path")
      .data(categoryCounts)
      .join("path")
      .attr("d", d => {
        const barWidth = x(d[1]) - margin.left;
        const barHeight = y.bandwidth();
        const r = Math.min(barHeight / 2, 3); // round only if space allows
        const x0 = margin.left;
        const y0 = y(d[0]);

        return `
        M${x0},${y0}
        h${barWidth - r}
        a${r},${r} 0 0 1 ${r},${r}
        v${barHeight - 2 * r}
        a${r},${r} 0 0 1 ${-r},${r}
        h${-barWidth + r}
        Z
      `;
      })
      .attr("fill", d => colorByLabel[d[0]] || "#36abcc")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(t("visualization.graduatesDuration.barchart.tooltip", { label: d[0], count: d[1] }));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX}px`)
          .style("top", `${event.clientY}px`);
      })
      .on("mouseout", (event, d) => {
        tooltip.style("opacity", 0);
      });

    // Value labels
    svg.append("g")
      .selectAll("text.count")
      .data(categoryCounts)
      .join("text")
      .attr("x", d => x(d[1]) + 5)
      .attr("y", d => y(d[0]) + y.bandwidth() / 2 + 4)
      .text(d => d[1])
      .attr("fill", "#333")
      .attr("font-size", "10px");

    function wrapAndCenter(textSelection, maxWidth) {
      const lineHeightEm = 1; // spacing between wrapped lines

      textSelection.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        const x = +text.attr("x") || 0; // keep left padding
        const y = +text.attr("y");        // this is already the band center

        text.text(null);

        let line = [], word;
        let tspan = text.append("tspan").attr("x", x).text("");
        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > maxWidth) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).text(word);
          }
        }

        // center vertically around the original y (band center)
        const tspans = text.selectAll("tspan");
        const n = tspans.size();
        tspans
          .attr("y", y)
          .attr("dy", (_, i) => ((i - (n - 1) / 2) * lineHeightEm) + "em");
      });
    }

    // Y Axis
    svg.append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},4)`)
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("text-anchor", "end")
      .attr("x", -10)             // padding from ticks
      .call(wrapAndCenter, 45);   // set your max label width (px)  

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll("text")
      .style("font-size", "10px");

    // Y Axis Label (vertical, rotated)
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 14) // closer or further from axis
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "11px")
      .text(t('visualization.graduatesDuration.barchart.yAxis'));

    // X Axis Label (horizontal)
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 2) // increase this for more spacing
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "11px")
      .text(t('visualization.graduatesDuration.barchart.xAxis'));
  }, [
    inactiveBubbleData,
    selectedYears,
    courseRange,
    selectedAdmissionTypes,
    barChartWidth,
    selectedAdmissionGroups
  ]);

  const filteredAdmissionTypes = useMemo(() => {
    return admissionTypes.filter((code) => {
      const group = admissionTypeGroups[code] || "Άλλο";
      return selectedAdmissionGroups.includes(group);
    });
  }, [admissionTypes, selectedAdmissionGroups]);


  useEffect(() => {
    const allowed = new Set(filteredAdmissionTypes);
    setSelectedAdmissionTypes((prev) => prev.filter((code) => allowed.has(code)));
  }, [filteredAdmissionTypes]);

  useEffect(() => {
    setSelectedAdmissionTypes(filteredAdmissionTypes);
  }, [filteredAdmissionTypes]);

  const allKeys = useMemo(() => {
    const keySet = new Set();
    rawData.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keySet.add(key));
    });
    return Array.from(keySet);
  }, [rawData]);


  return (
    <>
      <div className="flex flex-col mx-5 mt-5">
        <h2 className="text-xl font-semibold">{t("visualization.graduatesDuration.title")}</h2>

        <div className="flex flex-row gap-6 w-full">
          {/* Sidebar: Display options */}
          <div className="flex flex-col gap-3 mt-6 bg-white p-4 pr-6 rounded shadow w-[30%] max-h-[100vh] overflow-y-auto">
            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold text-md">{t('visualization.common.view.label')}</h2>

              <div className="flex border border-gray-300 rounded overflow-hidden">
                {[
                  { value: "individual", label: t('visualization.common.view.individual') },
                  { value: "grouped", label: t('visualization.common.view.grouped') }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`w-full text-center px-3 py-2 cursor-pointer transition-all duration-200
                        ${viewMode === option.value
                        ? "bg-secondary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    <input
                      type="radio"
                      name="viewMode"
                      value={option.value}
                      checked={viewMode === option.value}
                      onChange={() => setViewMode(option.value)}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {viewMode === "grouped" && (
                <select
                  value={groupedMode}
                  onChange={(e) => setGroupedMode(e.target.value)}
                  className="px-2 py-2 bg-secondary text-white text-sm w-full rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {groupOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="border-t border-gray-200"></div>

            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold text-md">{t('visualization.common.filterMode.label')}</h2>

              <div className="flex border border-gray-300 rounded overflow-hidden">
                {[
                  { value: "hide", label: t('visualization.common.filterMode.hide') },
                  { value: "dim", label: t('visualization.common.filterMode.dim') }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`w-full text-center px-3 py-2 cursor-pointer transition-all duration-200
          ${filterMode === option.value
                        ? "bg-secondary text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"}`}
                  >
                    <input
                      type="radio"
                      name="filterMode"
                      value={option.value}
                      checked={filterMode === option.value}
                      onChange={() => setFilterMode(option.value)}
                      className="hidden"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>


            <div className="border-t border-gray-200"></div>

            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold">{t('visualization.graduatesDuration.filtersPanel.title')}</h2>

              <div className="text-sm text-gray-700 font-base">

                <label className="font-medium">{t('visualization.graduatesDuration.filtersPanel.admissionYear')}</label>

                {minYear && maxYear && (
                  <MultiRangeSlider
                    min={minYear}
                    max={maxYear}
                    value={{
                      min: range.start,
                      max: range.end,
                    }}
                    onChange={({ min, max }) => {
                      setRange({
                        start: min,
                        end: max,
                      });
                    }}
                  />
                )}
              </div>

              <div className="text-sm text-gray-700 font-base">
                <label className="font-medium">{t('visualization.graduatesDuration.filtersPanel.passedCourses')}</label>

                {availableCourses.length > 0 && (
                  <MultiRangeSlider
                    min={Math.min(...availableCourses)}
                    max={Math.max(...availableCourses)}
                    value={{
                      min: courseRange.start,
                      max: courseRange.end,
                    }}
                    onChange={({ min, max }) => {
                      setCourseRange({
                        start: min,
                        end: max,
                      });
                    }}
                  />
                )}
              </div>

              <CheckboxFilter
                title={t('visualization.graduatesDuration.filtersPanel.admissionGroup')}
                options={admissionGroups}
                selected={selectedAdmissionGroups}
                setSelected={setSelectedAdmissionGroups}
                t={t}
              />

              <CheckboxFilter
                title={t('visualization.graduatesDuration.filtersPanel.admissionType')}
                options={filteredAdmissionTypes}
                selected={selectedAdmissionTypes}
                setSelected={setSelectedAdmissionTypes}
                descriptions={admissionTypeDescriptions}
                t={t}
              />

            </div>

          </div>
          {/* Main content (bubble chart and legend) */}
          <div id="graph" className="flex flex-row bg-white shadow shadow-lg rounded-lg mt-6 w-full">
            {/* Legend */}
            {/* <div className="flex flex-wrap gap-4 items-baseline w-[220px]">
              <div className="flex flex-col justify-center items-left gap-2 text-sm bg-white border-gray-300 border-[1px] shadow-sm m-2 px-2 py-2">
                <span className="text-gray-600">{t('visualization.graduatesDuration.legend.studyDuration')}</span>
                <div className="flex flex-col gap-2 mt-2 flex-wrap">
                  {speedLevels.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </div>
                  ))}
                </div>
                <p className="font-medium  mb-2 italic text-xs text-gray-600">{t('visualization.graduatesDuration.legend.noteN')}</p>
              </div>
            </div> */}


            {/* Chart container */}
            <div className="w-full m-4">
              {viewMode === "individual" && (
                <div>
                  <div ref={containerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={packedRef} className="absolute inset-0"></div>
                  </div>
                </div>
              )}

              {(viewMode === "grouped" && groupedMode === "byYear") && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByYear')}</h3>
                  <div ref={yearContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={yearPackedRef} className="absolute inset-0"></div>
                  </div>
                </div>
              )}
              {(viewMode === "grouped" && groupedMode === "byCategory") && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByCategory')}</h3>
                  <div ref={categoryContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={categoryPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}

              {viewMode === "grouped" && groupedMode === "byAdmissionGroup" && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByAdmissionGroup')}</h3>
                  <div ref={admissionGroupContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={admissionGroupPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}

              {viewMode === "grouped" && groupedMode === "byAdmissionType" && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByAdmissionType')}</h3>
                  <div ref={admissionContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={admissionPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
              {viewMode === "grouped" && groupedMode === "byStatus" && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByStatus')}</h3>
                  <div ref={statusContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={statusPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
              {viewMode === "grouped" && groupedMode === "byStudyDuration" && (
                <div>
                  <h3 className="text-lg font-medium">{t('visualization.graduatesDuration.headings.groupByStudyDuration')}</h3>
                  <div ref={durationContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={durationPackedRef} className="absolute inset-0" />
                  </div>
                </div>
              )}
            </div>
          </div>


          <div className="max-w-[25%] mt-6 w-full">

            <div className="flex flex-col justify-center items-left gap-2 text-sm border-gray-300 border-[1px] shadow-sm mb-2 px-2 py-2">
              <span className="text-gray-600">{t('visualization.graduatesDuration.legend.studyDuration')}</span>
              <div className="flex wrap-auto gap-2 mt-2 text-xs flex-wrap w-full">
                {inactivityLevels.map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2 border border-1 p-1 bg-gray-50">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </div>
                ))}
              </div>
              <p className="font-medium w-auto  mb-2 italic text-xs text-gray-600">
                {t('visualization.graduatesDuration.legend.noteN')}
              </p>

            </div>

            <div className="p-2 relative w-full bg-white shadow shadow-lg rounded-lg w-full">
              <p className="text-lg font-semibold text-primary">
                {t("visualization.graduatesDuration.summary.count", {
                  count: filterStudents({
                    data: inactiveBubbleData,
                    selectedYears,
                    courseRange,
                    selectedAdmissionTypes,
                    selectedAdmissionGroups,
                  }).length
                })}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                {t("visualization.inactiveStudents.summary.prefixAdmissionYear")}
                {range.start !== range.end ? ` ${range.start}–${range.end}` : ` ${range.start}`}
                {t("visualization.inactiveStudents.summary.coursesRangePrefix")} {courseRange.start}–{courseRange.end}
                {selectedAdmissionGroups.length > 0 ? (
                  <>
                    {t("visualization.inactiveStudents.summary.admissionGroupPrefix")} {selectedAdmissionGroups.join(", ")}
                    {t("visualization.inactiveStudents.summary.admissionTypesPrefix")} {selectedAdmissionTypes.length > 0 ? displayedAdmissions : "Κανέναν"}
                  </>
                ) : (
                  <>
                    {t("visualization.inactiveStudents.summary.admissionGroupPrefix")} {t("visualization.common.none_masc")}

                  </>

                )}
              </p>

              {selectedAdmissionTypes.length > 5 && (
                <button
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  {showFullDetails ? "Προβολή συνοπτικά" : "Προβολή αναλυτικά"}
                </button>
              )}
            </div>

            {/* Details panel */}
            {selectedBubble && (
              <div className="relative w-full p-2 text-sm bg-white shadow shadow-lg rounded-lg mt-2 w-full">
                <button
                  onClick={() => setSelectedBubble(null)}
                  className="absolute top-0 right-1 text-gray-500 hover:text-gray-800 text-3xl font-bold"
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: getColorBySpeed(selectedBubble.size) }}
                  />
                  <p className="text-md font-semibold">  {t("visualization.graduatesDuration.details.title")}
                  </p>
                </div>
                <div className="text-xs space-y-1">
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.lastAction")}:</span> {formatDateToYearMonth(selectedBubble.lastAction)}</p>
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.timeToDegree")}:</span> {formatYearsAndMonths(selectedBubble.size)}</p>
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.admissionYear")}:</span> {selectedBubble.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]}</p>
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.passedCourses")}:</span> {selectedBubble.r}</p>
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.status")}:</span> {selectedBubble.raw?.["ΚΑΤΑΣΤΑΣΗ"]}</p>
                  <p><span className="font-semibold">{t("visualization.graduatesDuration.details.admissionType")}:</span> {selectedBubble.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]}</p>
                </div>
              </div>
            )}

            <div className="w-full p-2 mt-2 bg-white shadow rounded-lg">

              <h4 className="text-sm font-semibold mb-1">Διάρκεια φοίτησης</h4>
              <div ref={categoryBarRef} className="w-full" />
            </div>

          </div>
        </div>

        {/* Tooltip */}
        <div
          id="bubble-tooltip"
          className="fixed text-xs bg-white border border-gray-300 text-gray-900 px-2 py-1 rounded shadow-lg z-50 opacity-0 pointer-events-none whitespace-pre-line"
        ></div>
      </div >

      <div className="mx-5 mt-5">
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-white bg-[#36abcc] rounded transition hover:bg-[#2c9cb7]"
        >
          <span>{showRawData ? t("visualization.common.hideData") : t("visualization.common.showData")}</span>
          <svg
            className={`w-5 h-5 transform transition-transform duration-300 ${showRawData ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${showRawData ? "max-h-[1000px]" : "max-h-0"}`}
        >
          <div className="bg-white p-4 rounded-b shadow">
            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              nextPage={nextPage}
              prevPage={prevPage}
              canGoNext={canGoNext}
              canGoPrev={canGoPrev}
            />

            {/* Table */}
            <div className="overflow-x-auto bg-gray-50 mt-4 border rounded max-h-[400px] overflow-y-auto text-sm">
              <table className="min-w-full border text-xs text-left">
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    {allKeys.map((key) => (
                      <th key={key} className="px-2 py-1 border-b whitespace-nowrap">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-100 border-t">
                      {allKeys.map((key, j) => (
                        <td key={j} className="px-2 py-1 border-b whitespace-nowrap">
                          {row && row[key] != null && row[key] !== "" ? String(row[key]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>

  );
};

export default GraduatesDuration;
