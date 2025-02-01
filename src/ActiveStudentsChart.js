import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "./data/active-students.xlsx";

const ActiveStudentsChart = () => {
  const chartRef = useRef(null);
  const [pivotedData, setPivotedData] = useState([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedYears, setSelectedYears] = useState([]); // Track selected years
  const [availableYears, setAvailableYears] = useState([]); // Populate dropdown

  const updateChartWidth = () => {
    if (chartRef.current) {
      setChartWidth(chartRef.current.offsetWidth);
    }
  };

  const loadExcelData = async () => {
    const response = await fetch(excelFile);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const transformedData = [];
    const yearsSet = new Set();

    sheetData.forEach((row) => {
      const year = row["Έτος εγγραφής"];
      yearsSet.add(year);
      Object.keys(row).forEach((key) => {
        if (!isNaN(key)) {
          transformedData.push({
            year: year,
            passedCourses: parseInt(key),
            students: row[key],
          });
        }
      });
    });

    setPivotedData(transformedData);
    setAvailableYears(Array.from(yearsSet).sort());
  };

  const createChart = () => {
    if (!pivotedData.length) return;

    const margin = { top: 40, right: 30, bottom: 70, left: 60 };
    const width = chartRef.current.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 50)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Filter data based on selected years
    const filteredData =
      selectedYears.length === 0
        ? pivotedData
        : pivotedData.filter((d) => selectedYears.includes(d.year));

    const groupedData = d3.groups(filteredData, (d) => d.year);

    const x = d3
      .scaleBand()
      .domain(groupedData.map(([year]) => year))
      .range([0, width])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(groupedData, ([, values]) =>
          d3.sum(values, (d) => d.students)
        ),
      ])
      .nice()
      .range([height, 0]);

    const color = d3.scaleSequential(d3.interpolateOranges).domain([0, 52]);

    // Tooltip container
    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .style("position", "fixed")
      .style("background", "white")
      .style("border", "1px solid gray")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .attr("class", "shadow-md text-xs max-w-xs");

    // Add axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => d.toString()))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(y));

    groupedData.forEach(([year, values]) => {
      let cumulative = 0;
      const totalStudents = d3.sum(values, (d) => d.students);

      const yearData = values
        .filter((d) => d.students > 0)
        .sort((a, b) => a.passedCourses - b.passedCourses) // Sort by passed courses
        .map(
          (d) =>
            `<strong>Passed Courses:</strong> ${d.passedCourses} | <strong>Students Passed:</strong> ${d.students}`
        )
        .join("<br/>");

      const tooltipContent = `
        <strong>Year:</strong> ${year}<br/>
        <strong>Active Students:</strong> ${totalStudents}<br/>
        ${yearData}
      `;

      values.forEach((d) => {
        svg
          .append("rect")
          .attr("x", x(year))
          .attr("y", y(cumulative + d.students))
          .attr("width", x.bandwidth())
          .attr("height", y(cumulative) - y(cumulative + d.students))
          .attr("fill", color(d.passedCourses))
          .on("mouseover", () => {
            tooltip
              .style("opacity", 0.8)
              .html(tooltipContent);
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY/2 + "px");
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });

        cumulative += d.students;
      });

      svg
        .append("text")
        .attr("x", x(year) + x.bandwidth() / 2)
        .attr("y", y(cumulative) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(totalStudents);
    });

    const legendWidth = 300;
    const legendHeight = 10;

    const legendSvg = svg
      .append("g")
      .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 50})`);

    const gradient = legendSvg
      .append("defs")
      .append("linearGradient")
      .attr("id", "color-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .selectAll("stop")
      .data(
        d3.ticks(0, 1, 10).map((t) => ({
          offset: `${t * 100}%`,
          color: d3.interpolateOranges(t),
        }))
      )
      .enter()
      .append("stop")
      .attr("offset", (d) => d.offset)
      .attr("stop-color", (d) => d.color);

    legendSvg
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#color-gradient)");

    legendSvg
      .append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(
        d3
          .axisBottom(
            d3.scaleLinear().domain([0, 52]).range([0, legendWidth])
          )
          .ticks(6)
      );

    legendSvg
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", legendHeight + 30)
      .attr("text-anchor", "middle")
      .text("Number of Passed Courses");
  };

  useEffect(() => {
    loadExcelData();
  }, []);

  useEffect(() => {
    createChart();
  }, [pivotedData, chartWidth, selectedYears]);

  useEffect(() => {
    window.addEventListener("resize", updateChartWidth);
    updateChartWidth();
    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);

  const toggleYearSelection = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year]
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Students Passing Courses Over the Years</h1>

      {/* Multi-Select Year Filter */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by Year:</label>
        <div className="flex flex-wrap gap-2">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => toggleYearSelection(year)}
              className={`px-3 py-1 border rounded ${
                selectedYears.includes(year)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {year}
            </button>
          ))}
          {selectedYears.length > 0 && (
            <button
              onClick={() => setSelectedYears([])}
              className="px-3 py-1 border rounded bg-red-500 text-white"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div ref={chartRef} className="w-full relative"></div>
    </div>
  );
};

export default ActiveStudentsChart;
