import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "../../data/di_stats.xlsx";
import { useTranslation } from "react-i18next";
import MultiRangeSlider from "../../components/MultiRangeSlider";
import { usePagination } from "../../hooks/usePagination";
import PaginationControls from "../../components/PaginationControls";
import { admissionTypeGroups } from "../../data/students/studentMetadata";

// Utils

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
          <span className="text-gray-800 font-medium">{t("visualization.common.all")}</span>
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

function filterStudents({ data, selectedYears, selectedAdmissionGroups }) {
  return data.filter(b =>
    selectedYears.includes(Number(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"])) &&
    selectedAdmissionGroups.includes(b.admissionGroup)
  );
}


// Main Component
const GraduationTimelines = () => {
  const { t } = useTranslation();

  // States
  const [rawData, setRawData] = useState([]);
  const [showRawData, setShowRawData] = useState(false);


  const StaticCircleSizeLegend = ({
    steps = [10, 50, 100],
    label = t('visualization.graduationTimelines.legendSizeByStudents')
  }) => {
    // Use the same min/max as your scale
    const minCircle = 4, maxCircle = 18;
    const scale = d3.scaleSqrt().domain([steps[0], steps[steps.length - 1]]).range([minCircle, maxCircle]);

    return (
      <div className="flex flex-col gap-1 border border-gray-300 shadow shadow-md p-2">
        <div className="font-semibold text-xs text-gray-600">{label}</div>
        <div className="flex flex-row gap-4 items-end">
          {steps.map(count => (
            <div key={count} className="flex flex-col items-center">
              <svg width={scale(count) * 2 + 8} height={scale(count) * 2 + 8}>
                <circle
                  cx={scale(count) + 4}
                  cy={scale(count) + 4}
                  r={scale(count)}
                  fill="#bbb"
                  stroke="#444"
                />
              </svg>
              <span className="text-xs text-gray-500 mt-1">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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

  const [studentsData, setInactiveBubbleData] = useState([]);

  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  const gradesChartRef = useRef(null);
  const gradeContainerRef = useRef(null);

  const [admissionGroups, setAdmissionGroups] = useState([]);


  const [selectedAdmissionGroups, setSelectedAdmissionGroups] = useState([]);

  // Refs for D3 containers
  const graduatesChartRef = useRef(null);
  const containerRef = useRef(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });


  useEffect(() => {
    console.log('availableYears', availableYears)
    if (availableYears.length > 0) {
      setMinYear(Math.min(...availableYears));
      setMaxYear(Math.max(...availableYears));
    }
  }, [availableYears])

  useEffect(() => {
    const observeTarget = containerRef.current;

    if (!observeTarget) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(observeTarget);
    return () => observeTarget && resizeObserver.unobserve(observeTarget);
  }, []);


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

      const bubbles = sheetData
        .filter(row => row["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"])
        .map(row => {
          const lastActionRaw = Math.max(
            row["ΤΕΛΕΥΤΑΙΑ ΔΗΛΩΣΗ"] || 0,
            row["ΤΕΛΕΥΤΑΙΑ ΕΠΙΤΥΧΗΣ ΕΞΕΤΑΣΗ"] || 0,
            row["ΤΕΛΕΥΤΑΙΑ ΑΠΟΤΥΧΙΑ"] || 0,
            row["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] + '091' || 0
          );

          const str = String(lastActionRaw);
          let year = parseInt(str.slice(0, 4));
          let month, day;


          month = parseInt(str.slice(4, 6))
          day = parseInt(str.slice(6, 7));

          const lastActionDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
          const yearsInactive = (today - lastActionDate) / (1000 * 60 * 60 * 24 * 365.25);

          const currentYear = today.getFullYear();
          const enrollmentYear = row["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
          const yearsStudied = currentYear - enrollmentYear;
          const n = 4;

          let durationCategory;
          if (yearsStudied <= n) durationCategory = `0 έως και ${n}`;
          else if (yearsStudied === n + 1) durationCategory = `${n + 1}`;
          else if (yearsStudied === n + 2) durationCategory = `${n + 2}`;
          else durationCategory = `${n + 3}+`;

          const admissionCode = row["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"];
          const admissionGroup = admissionTypeGroups[admissionCode] || "Άλλοι Τρόποι";

          return {
            r: row["ΠΛΗΘΟΣ ΜΑΘΗΜΑΤΩΝ"] || 0,
            size: yearsInactive || 0.5,
            year,
            lastActionDate,
            lastAction: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            durationCategory,
            admissionGroup,
            raw: row
          };
        })
        .filter(d => !isNaN(d.lastActionDate));

      setRawData(sheetData);
      setInactiveBubbleData(bubbles);

      const years = [...new Set(bubbles.map(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]))].sort((a, b) => a - b);
      setAvailableYears(years);
      setSelectedYears(years); // Default to all years visible

      setRange({
        start: Math.min(...years),
        end: Math.max(...years),
      });



      const uniqueAdmissionGroups = [...new Set(bubbles.map(b => b.admissionGroup))];
      setAdmissionGroups(uniqueAdmissionGroups);
      setSelectedAdmissionGroups(uniqueAdmissionGroups); // default: all selected

    };

    loadExcelData();
  }, []);


  const allKeys = useMemo(() => {
    const keySet = new Set();
    rawData.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keySet.add(key));
    });
    return Array.from(keySet);
  }, [rawData]);


  function getValueFromData(data, group, year) {
    const groupData = data.find(d => d.group === group);
    if (!groupData) return null;

    const value = groupData.values.find(v => +v.year === +year);

    console.log("Hovered group", group, "year", year);

    return value ? +value.count : null;
  }


  function drawVerticalLine(g, x, className, height, color = "#aaa") {
    g.selectAll(`.${className}`).remove();
    g.append("line")
      .attr("class", className)
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", color)
      .attr("stroke-dasharray", "4");
  }

  function drawHorizontalLine(g, y, className, width, color = "#aaa") {
    g.selectAll(`.${className}`).remove();
    g.append("line")
      .attr("class", className)
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y)
      .attr("y2", y)
      .attr("stroke", color)
      .attr("stroke-dasharray", "4");
  }

  const graduateData = useMemo(() => {
    const filtered = filterStudents({ data: studentsData, selectedYears, selectedAdmissionGroups });

    const graduates = filtered.filter(row =>
      row.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] &&
      row.raw["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"] &&
      row.raw["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"] >= row.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]
    );

    const grouped = {};

    for (const row of graduates) {
      const enrollmentYear = row.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
      const graduationYear = row.raw["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"];
      const code = row.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"];
      const group = admissionTypeGroups[code] || "Άλλοι Τρόποι";
      const yearsToGraduate = graduationYear - enrollmentYear;

      if (!grouped[group]) grouped[group] = {};
      if (!grouped[group][enrollmentYear]) grouped[group][enrollmentYear] = [];

      grouped[group][enrollmentYear].push(yearsToGraduate);
    }

    return Object.entries(grouped).map(([group, yearMap]) => ({
      group,
      values: Object.entries(yearMap)
        .map(([year, list]) => ({
          year,
          count: (list.reduce((a, b) => a + b, 0) / list.length).toFixed(2), // mean
          studentCount: list.length, // <-- add this
        }))
        .sort((a, b) => a.year - b.year)
    }));
  }, [studentsData, selectedYears, selectedAdmissionGroups]);

  const averageGradeData = useMemo(() => {
    const filtered = filterStudents({ data: studentsData, selectedYears, selectedAdmissionGroups });

    const withGrade = filtered.filter(row =>
      row.raw["ΒΑΘΜΟΣ ΠΤΥΧΙΟΥ"] &&
      !isNaN(Number(row.raw["ΒΑΘΜΟΣ ΠΤΥΧΙΟΥ"]))
    );

    const grouped = {};

    for (const row of withGrade) {
      const enrollmentYear = row.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"];
      const code = row.raw["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"];
      const group = admissionTypeGroups[code] || "Άλλοι Τρόποι";
      const grade = Number(row.raw["ΒΑΘΜΟΣ ΠΤΥΧΙΟΥ"]);

      if (!grouped[group]) grouped[group] = {};
      if (!grouped[group][enrollmentYear]) grouped[group][enrollmentYear] = [];

      grouped[group][enrollmentYear].push(grade);
    }

    return Object.entries(grouped).map(([group, yearMap]) => ({
      group,
      values: Object.entries(yearMap)
        .map(([year, list]) => ({
          year,
          count: (list.reduce((a, b) => a + b, 0) / list.length).toFixed(2),
          studentCount: list.length, // <-- add this

        }))
        .sort((a, b) => a.year - b.year)
    }));
  }, [studentsData, selectedYears, selectedAdmissionGroups]);


  useEffect(() => {
    if (!graduateData || !graduatesChartRef.current || !dimensions.width || !dimensions.height) return;

    console.log('graduateData', graduateData)
    const svg = d3.select(graduatesChartRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const margin = { top: 10, right: 10, bottom: 50, left: 50 };
    const width = dimensions.width;
    const height = dimensions.height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.node().parentGroup = g; // helpful later

    const allYears = Array.from(new Set(graduateData.flatMap((d) => d.values.map((v) => v.year)))).sort();
    const xScale = d3.scalePoint().domain(allYears).range([0, innerWidth]);
    const allCounts = graduateData.flatMap(d => d.values.map(v => +v.count));
    const yMin = Math.max(0, Math.floor(Math.min(...allCounts) * 10) / 10 - 0.1);
    const yMax = Math.ceil(Math.max(...allCounts) * 10) / 10 + 0.1;

    const allStudentCounts = graduateData.flatMap(d => d.values.map(v => v.studentCount));

    const minCircle = 3;  // minimum circle radius
    const maxCircle = 8; // maximum circle radius

    const circleSizeScale = d3.scaleSqrt() // sqrt gives better visual distribution
      .domain([Math.min(...allStudentCounts), Math.max(...allStudentCounts)])
      .range([minCircle, maxCircle]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerHeight, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(graduateData.map(d => d.group));

    g.append("g").call(d3.axisLeft(yScale));
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Add tooltip hover rectangles on each year
    xAxis.selectAll(".tick")
      .append("rect")
      .attr("x", -10)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 30)
      .attr("fill", "transparent")
      .on("mouseover", function (event, year) {
        const x = xScale(year);
        d3.select("#bubble-tooltip")
          .style("opacity", 1)
          .html(
            `${t("visualization.graduationTimelines.tooltip.year")}: ${year}`
          )
          .style("left", `${event.clientX + 12}px`)
          .style("top", `${event.clientY + 12}px`);

        // Draw vertical line
        drawVerticalLine(g, x, "x-line-hover", innerHeight, "#888");

        // Also sync line in the other chart
        const otherG = d3.select(gradesChartRef.current).select("svg g");
        if (!otherG.empty()) {
          drawVerticalLine(otherG, x, "x-line-hover", innerHeight, "#888");
        }
      })
      .on("mousemove", function (event) {
        d3.select("#bubble-tooltip")
          .style("left", `${event.clientX + 12}px`)
          .style("top", `${event.clientY + 12}px`);
      })
      .on("mouseout", function () {
        d3.select("#bubble-tooltip").style("opacity", 0);
        g.selectAll(".x-line-hover").remove();
        d3.select(gradesChartRef.current).select("svg g").selectAll(".x-line-hover").remove();
        d3.select(graduatesChartRef.current).select("svg g").selectAll(".x-line-hover").remove();
      });

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .text(t('visualization.graduationTimelines.xAxis'))
      .attr("fill", "#333")
      .attr("font-size", 12);

    // draw lines
    graduateData.forEach(groupData => {
      for (let i = 1; i < groupData.values.length; ++i) {
        const prev = groupData.values[i - 1];
        const curr = groupData.values[i];
        g.append("line")
          .attr("x1", xScale(prev.year))
          .attr("y1", yScale(prev.count))
          .attr("x2", xScale(curr.year))
          .attr("y2", yScale(curr.count))
          .attr("stroke", color(groupData.group))
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("opacity", 0.85)
          .attr("class", "line-path");
      }
    });


    // draw points for tooltip
    graduateData.forEach((groupData, groupIdx) => {
      g.selectAll(`.dot-${groupIdx}`)
        .data(groupData.values)
        .enter()
        .append("circle")
        .attr("class", `dot-${groupIdx}`)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", d => circleSizeScale(d.studentCount))
        .attr("fill", color(groupData.group))
        .on("mouseover", function (event, d) {
          d3.select("#bubble-tooltip")
            .style("opacity", 1)
            .html(
              `${t("visualization.graduationTimelines.tooltip.year")}: ${d.year}
               ${t("visualization.graduationTimelines.tooltip.avgGrade")}: ${d.count}
               ${t("visualization.graduationTimelines.tooltip.students")}: ${d.studentCount}`
            );
          d3.select("#bubble-tooltip")
            .style("left", (event.clientX + 16) + "px")
            .style("top", (event.clientY + 16) + "px");

          const x = xScale(d.year);
          const y = yScale(d.count);
          const group = groupData.group;

          // current chart
          drawVerticalLine(g, x, "x-line", innerHeight, color(group));
          drawHorizontalLine(g, y, "y-line", innerWidth, color(group));

          // other chart
          const gradeG = d3.select(gradesChartRef.current).select("svg g");
          drawVerticalLine(gradeG, x, "x-line", innerHeight, color(group));

          const gradeValue = getValueFromData(averageGradeData, group, d.year);
          console.log("Hovered group:", group, "year:", d.year, "→ matched value:", gradeValue);

          const allGradeCounts = averageGradeData.flatMap(d => d.values.map(v => +v.count));
          const yMinGrade = Math.max(5, Math.floor(Math.min(...allGradeCounts) * 10) / 10 - 0.1);
          const yMaxGrade = Math.ceil(Math.max(...allGradeCounts) * 10) / 10 + 0.1;
          const yScaleGrade = d3.scaleLinear()
            .domain([yMinGrade, yMaxGrade])
            .nice()
            .range([innerHeight, 0]);

          if (gradeValue != null) {
            const yOther = yScaleGrade(gradeValue); // ✅ Use grade chart scale!
            drawHorizontalLine(gradeG, yOther, "y-line", innerWidth, color(group));
          }

        })
        .on("mouseout", function () {
          d3.select("#bubble-tooltip").style("opacity", 0);
          // Remove lines from graduates
          d3.select(this.parentNode).selectAll(".x-line, .y-line").remove();
          // Remove lines from grades
          d3.select(gradesChartRef.current).select("svg g").selectAll(".x-line, .y-line").remove();
        })

    });


    g.append("g").call(d3.axisLeft(yScale));
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .text(t('visualization.graduationTimelines.yAxisYearsToGraduate'))
      .attr("fill", "#333")
      .attr("font-size", 12);

  }, [graduateData, dimensions, averageGradeData, t]);


  useEffect(() => {
    if (!averageGradeData || !gradesChartRef.current || !dimensions.width || !dimensions.height) return;

    const svg = d3.select(gradesChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 10, right: 10, bottom: 50, left: 50 };
    const width = dimensions.width;
    const height = dimensions.height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allYears = Array.from(new Set(averageGradeData.flatMap((d) => d.values.map((v) => v.year)))).sort();
    const xScale = d3.scalePoint().domain(allYears).range([0, innerWidth]);
    const allCounts = averageGradeData.flatMap(d => d.values.map(v => +v.count));
    const yMin = Math.max(5, Math.floor(Math.min(...allCounts) * 10) / 10 - 0.1); // clamp to at least 5
    const yMax = Math.ceil(Math.max(...allCounts) * 10) / 10 + 0.1;

    const allStudentCounts = averageGradeData.flatMap(d => d.values.map(v => v.studentCount));

    const minCircle = 3;  // minimum circle radius
    const maxCircle = 8; // maximum circle radius

    const circleSizeScale = d3.scaleSqrt() // sqrt gives better visual distribution
      .domain([Math.min(...allStudentCounts), Math.max(...allStudentCounts)])
      .range([minCircle, maxCircle]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerHeight, 0]);

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(averageGradeData.map(d => d.group));

    g.append("g").call(d3.axisLeft(yScale));
    const xAxis = g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // Add tooltip hover rectangles on each year
    xAxis.selectAll(".tick")
      .append("rect")
      .attr("x", -10)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 30)
      .attr("fill", "transparent")
      .on("mouseover", function (event, year) {
        const x = xScale(year);
        d3.select("#bubble-tooltip")
          .style("opacity", 1)
          .html(
            `${t("visualization.graduationTimelines.tooltip.year")}: ${year}`
          )
          .style("left", `${event.clientX + 12}px`)
          .style("top", `${event.clientY + 12}px`);

        // Draw vertical line
        drawVerticalLine(g, x, "x-line-hover", innerHeight, "#888");

        // Also sync line in the other chart
        const otherG = d3.select(graduatesChartRef.current).select("svg g");
        if (!otherG.empty()) {
          drawVerticalLine(otherG, x, "x-line-hover", innerHeight, "#888");
        }

      })
      .on("mousemove", function (event) {
        d3.select("#bubble-tooltip")
          .style("left", `${event.clientX + 12}px`)
          .style("top", `${event.clientY + 12}px`);
      })
      .on("mouseout", function () {
        d3.select("#bubble-tooltip").style("opacity", 0);
        g.selectAll(".x-line-hover").remove();
        d3.select(gradesChartRef.current).select("svg g").selectAll(".x-line-hover").remove();
        d3.select(graduatesChartRef.current).select("svg g").selectAll(".x-line-hover").remove();
      });
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 5)
      .text(t('visualization.graduationTimelines.xAxis'))
      .attr("fill", "#333")
      .attr("font-size", 12);

    averageGradeData.forEach(groupData => {
      for (let i = 1; i < groupData.values.length; ++i) {
        const prev = groupData.values[i - 1];
        const curr = groupData.values[i];
        g.append("line")
          .attr("x1", xScale(prev.year))
          .attr("y1", yScale(prev.count))
          .attr("x2", xScale(curr.year))
          .attr("y2", yScale(curr.count))
          .attr("stroke", color(groupData.group))
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("opacity", 0.85)
          .attr("class", "line-path");
      }
    });


    averageGradeData.forEach((groupData, groupIdx) => {
      g.selectAll(`.grade-dot-${groupIdx}`)
        .data(groupData.values)
        .enter()
        .append("circle")
        .attr("class", `grade-dot-${groupIdx}`)
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", d => circleSizeScale(d.studentCount))
        .attr("fill", color(groupData.group))
        .on("mouseover", function (event, d) {
          d3.select("#bubble-tooltip")
            .style("opacity", 1)
            .html(
              `${t("visualization.graduationTimelines.tooltip.year")}: ${d.year}
               ${t("visualization.graduationTimelines.tooltip.avgGrade")}: ${d.count}
               ${t("visualization.graduationTimelines.tooltip.students")}: ${d.studentCount}`
            );
          d3.select("#bubble-tooltip")
            .style("left", (event.clientX + 16) + "px")
            .style("top", (event.clientY + 16) + "px");

          const x = xScale(d.year);
          const y = yScale(d.count);
          const group = groupData.group;

          // current chart
          drawVerticalLine(g, x, "x-line", innerHeight, color(group));
          drawHorizontalLine(g, y, "y-line", innerWidth, color(group));

          // other chart (graduates)
          const gradG = d3.select(graduatesChartRef.current).select("svg g");
          drawVerticalLine(gradG, x, "x-line", innerHeight, color(group));

          // Graduation value for this group/year
          const gradValue = getValueFromData(graduateData, group, d.year);
          if (gradValue != null) {
            // Calculate the graduates yScale
            const allGradCounts = graduateData.flatMap(d => d.values.map(v => +v.count));
            const yMinGrad = Math.max(0, Math.floor(Math.min(...allGradCounts) * 10) / 10 - 0.1);
            const yMaxGrad = Math.ceil(Math.max(...allGradCounts) * 10) / 10 + 0.1;
            const yScaleGrad = d3.scaleLinear()
              .domain([yMinGrad, yMaxGrad])
              .nice()
              .range([innerHeight, 0]);
            const yOther = yScaleGrad(gradValue);
            drawHorizontalLine(gradG, yOther, "y-line", innerWidth, color(group));
          }
        })
        .on("mouseout", function () {
          d3.select("#bubble-tooltip").style("opacity", 0);
          // Remove lines from grades
          d3.select(this.parentNode).selectAll(".x-line, .y-line").remove();
          // Remove lines from graduates
          d3.select(graduatesChartRef.current).select("svg g").selectAll(".x-line, .y-line").remove();
        })

    });


    g.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -margin.left + 15)
      .text(t('visualization.graduationTimelines.yAxisAvgGrade'))
      .attr("fill", "#333")
      .attr("font-size", 12);
  }, [averageGradeData, dimensions, graduateData, t]);

  return (
    <>
      <div className="flex flex-col mx-5 mt-5">
        <h2 className="text-xl font-semibold">{t('visualization.graduationTimelines.title')}</h2>

        <div className="flex flex-row gap-6 w-full">
          {/* Sidebar: Display options */}
          <div className="flex flex-col gap-3 mt-6 bg-white p-4 rounded shadow w-60">
            {/* <div className="flex flex-col gap-2 text-sm">
            </div> */}

            <div className="flex flex-col gap-2 text-sm">
              <h2 className="text-md font-semibold">{t('visualization.common.filters')}</h2>

              <div className="text-sm text-gray-700 font-base">

                <label className="font-medium">{t('visualization.common.admissionYear')}</label>

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

                <CheckboxFilter
                  title={t('visualization.common.admissionCategory')}
                  options={admissionGroups}
                  selected={selectedAdmissionGroups}
                  setSelected={setSelectedAdmissionGroups}
                  t={t}
                />
              </div>
            </div>

          </div>
          {/* Main content (bubble chart and legend) */}
          <div id="graph" className="flex flex-row bg-white shadow shadow-lg rounded-lg mt-6 w-full">

            {/* Chart container */}
            <div className="w-full m-4">

              <h3 className="text-lg font-semibold mb-2">{t("visualization.graduationTimelines.graduatesTitle")}</h3>
              <div ref={containerRef} style={{ height: "40vh", width: "100%" }} className="relative">
                <div ref={graduatesChartRef} className="absolute inset-0"></div>
              </div>
              <h3 className="text-lg font-semibold mt-4 mb-2">{t("visualization.graduationTimelines.avgGradeTitle")}</h3>
              <div ref={gradeContainerRef} style={{ height: "40vh", width: "100%" }} className="relative">
                <div ref={gradesChartRef} className="absolute inset-0"></div>
              </div>
            </div>
          </div>

          <div className="max-w-[20%] mt-6 flex flex-col gap-2">

            <div className="flex flex-col gap-1 border border-gray-300 shadow shadow-md p-2">
              {graduateData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg width="24" height="6">
                    <line
                      x1="0"
                      y1="3"
                      x2="24"
                      y2="3"
                      stroke={d3.schemeTableau10[i % 10]}
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="text-xs text-gray-700">{d.group}</span>
                </div>
              ))}
            </div>

            <StaticCircleSizeLegend steps={[10, 50, 100]} />

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
          <span>{showRawData ? "Απόκρυψη δεδομένων" : "Εμφάνιση δεδομένων"}</span>
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

export default GraduationTimelines;
