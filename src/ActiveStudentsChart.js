import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "./data/active-students.xlsx";
import YearSelection from "./YearSelection"; // Import the new component
import { MdOutlineCleaningServices } from "react-icons/md";

const ActiveStudentsChart = () => {
  const chartRef = useRef(null);
  const treeMapRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pivotedData, setPivotedData] = useState([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedYears, setSelectedYears] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Popup State
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [filterType, setFilterType] = useState("multi");

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

    console.log('transformedData', transformedData)
    setPivotedData(transformedData);
    setAvailableYears(Array.from(yearsSet).sort());
  };

  const createChart = () => {
    if (!pivotedData.length) return;

    const margin = { top: 40, right: 30, bottom: 40, left: 60 };
    const width = chartRef.current.offsetWidth - margin.left - margin.right;
    const height = Math.min(200, Math.max(100, pivotedData.length * 3)); // Adjust height dynamically

    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

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

    const color = d3.scaleSequential(d3.interpolateOranges).domain([52, 0]);

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
      const totalPassedCourses = d3.sum(
        values,
        (d) => d.passedCourses * d.students
      );
      const averagePassedCourses = totalStudents
        ? (totalPassedCourses / totalStudents).toFixed(2)
        : 0;

      const tooltipContent = `
        <strong>Year:</strong> ${year}<br/>
        <strong>Total Active Students:</strong> ${totalStudents}<br/>
        <strong>Average Passed Courses:</strong> ${averagePassedCourses}
      `;

      values.forEach((d) => {
        svg
          .append("rect")
          .attr("x", x(year))
          .attr("y", y(cumulative + d.students))
          .attr("width", x.bandwidth())
          .attr("height", y(cumulative) - y(cumulative + d.students))
          .attr("fill", color(d.passedCourses))
          .on("mouseover", (event) => {
            const tooltip = tooltipRef.current;
            tooltip.style.opacity = 1;
            tooltip.innerHTML = tooltipContent;
          })
          .on("mousemove", (event) => {
            const tooltip = tooltipRef.current;
            const tooltipWidth = tooltip.offsetWidth;
            const screenWidth = window.innerWidth;
            const mouseX = event.pageX;
            const mouseY = event.pageY;

            const isRightHalf = mouseX > screenWidth / 2;
            const offsetX = 20;

            const tooltipX = isRightHalf
              ? Math.max(10, mouseX - tooltipWidth - offsetX)
              : Math.min(screenWidth - tooltipWidth - 10, mouseX + offsetX);

            const tooltipY = mouseY - 20;

            tooltip.style.left = `${tooltipX}px`;
            tooltip.style.top = `${tooltipY}px`;
          })
          .on("mouseout", () => {
            tooltipRef.current.style.opacity = 0;
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
  };

  const createTreeMap = () => {
    if (!pivotedData.length) return;
  
    d3.select(treeMapRef.current).selectAll("*").remove();
  
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = treeMapRef.current.offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const svg = d3
      .select(treeMapRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // ✅ Apply Year Filter
    const filteredData =
      selectedYears.length === 0
        ? pivotedData
        : pivotedData.filter((d) => selectedYears.includes(d.year));
  
    // ✅ Group Data by Passed Courses
    const groupedData = d3.groups(filteredData, (d) => d.passedCourses);
  
    // ✅ Convert to Hierarchical Format for Tree Map
    const root = d3
      .hierarchy({
        children: groupedData.map(([passedCourses, students]) => ({
          name: `Μαθ: ${passedCourses}`,
          students: d3.sum(students, (d) => d.students),
        })),
      })
      .sum((d) => d.students);
  
    // ✅ Create Tree Map Layout
    d3.treemap()
      .size([width, height])
      .padding(3) // 🔹 Increased padding for readability
      .round(true) // 🔹 Makes layout smoother
      (root);
  
    // ✅ Keep Previous Color Scale (`d3.interpolateOranges`)
    const color = d3.scaleSequential(d3.interpolateOranges).domain([
      d3.min(root.leaves(), (d) => d.data.students), // Highest student count
      52, // Lowest student count
    ]);

    const cell = svg
      .selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
  
    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.data.students));
  
    // ✅ Conditionally Show Text (Only If Box Is Large Enough)
    cell
      .filter((d) => d.x1 - d.x0 > 50 && d.y1 - d.y0 > 30) // Only show text in larger boxes
      .append("text")
      .attr("x", 5)
      .attr("y", 15)
      .text((d) => d.data.name)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white");
  
    cell
      .filter((d) => d.x1 - d.x0 > 50 && d.y1 - d.y0 > 30) // Only show student count in larger boxes
      .append("text")
      .attr("x", 5)
      .attr("y", 30)
      .text((d) => `Φοιτ: ${d.data.students}`)
      .attr("font-size", "12px")
      .attr("fill", "white");
  };
  

  useEffect(() => {
    loadExcelData();
  }, []);

  useEffect(() => {
    createChart();
    createTreeMap();
  }, [pivotedData, chartWidth, selectedYears]);

  useEffect(() => {
    window.addEventListener("resize", updateChartWidth);
    updateChartWidth();
    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);


  return (
    <div className="relative">
      <h1 className="text-2xl text-center mt-2 font-bold mb-4">Students Passing Courses Over the Years</h1>

      <div className="px-12 flex items-center gap-6">
        <p>Filters: </p>
        <div className="flex flex-center">
          <button
            onClick={() => setIsPopupOpen(true)}
            className={`px-4 py-1.5 text-sm  shadow bg-gray-300 font-medium ${selectedYears.length > 0 ? 'text-blue-600  border-b-2 border-blue-600' : 'text-gray-800'} rounded`}
          >
            Year
          </button>
          {selectedYears.length > 0 && (
            <button
              onClick={() => setSelectedYears([])}
              className=" px-2 py-2 text-gray-500 rounded"
            >
              <MdOutlineCleaningServices size={20} />
            </button>
          )}
        </div>
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow-xl w-96 space-y-4">
            <h2 className="text-lg font-semibold">Filter Years</h2>

            {/* Year Selection Component */}
            <YearSelection
              availableYears={availableYears}
              selectedYears={selectedYears} // Pass current selected years
              setSelectedYears={setSelectedYears}
              onClose={() => setIsPopupOpen(false)}
              filterType={filterType} // Pass filterType to YearSelection
              setFilterType={setFilterType} // Pass setFilterType to YearSelection
            />
          </div>
        </div>
      )}

      <div ref={chartRef} className="w-full relative"></div>

      <h2 className="text-xl text-center mt-6 font-bold">Student Distribution by Passed Courses</h2>
      <div ref={treeMapRef} className="w-full relative"></div>

      <div
        ref={tooltipRef}
        className="fixed bg-white/90 border border-gray-200 text-xs p-2 rounded pointer-events-none opacity-0 z-10 shadow-lg max-w-xs"
      ></div>
    </div>
  );
};

export default ActiveStudentsChart;
