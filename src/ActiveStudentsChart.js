import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "./data/active-students.xlsx";
import YearSelection from "./YearSelection"; // Import the new component
import { MdOutlineCleaningServices } from "react-icons/md";
import PassedCoursesSelection from "./PassedCoursesSelection";
import course, { ReactComponent as CourseIcon } from './assets/course.svg';
import student, { ReactComponent as StudentIcon } from './assets/student.svg';

const ActiveStudentsChart = () => {
  const chartRef = useRef(null);
  const treeMapRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pivotedData, setPivotedData] = useState([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isCoursePopupOpen, setIsCoursePopupOpen] = useState(false);

  const [minPassedCourses, setMinPassedCourses] = useState(0);
  const [maxPassedCourses, setMaxPassedCourses] = useState(52);

  const [minStudents, setMinStudents] = useState(null);
  const [midStudents, setMidStudents] = useState(null);
  const [maxStudents, setMaxStudents] = useState(null);
  // Popup State
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
    const coursesSet = new Set();

    sheetData.forEach((row) => {
      const year = row["Έτος εγγραφής"];
      yearsSet.add(year);
      Object.keys(row).forEach((key) => {
        if (!isNaN(key)) {
          coursesSet.add(parseInt(key));
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
    const sortedCourses = Array.from(coursesSet).sort((a, b) => a - b);
    setAvailableCourses(sortedCourses);
    setMinPassedCourses(sortedCourses[0]);
    setMaxPassedCourses(sortedCourses[sortedCourses.length - 1]);

  };

  const colorScale = d3
    .scaleSequential(d3.interpolateOranges)
    .domain([maxPassedCourses, minPassedCourses]);

  const createChart = () => {
    if (!pivotedData.length) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
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

    let filteredData = pivotedData;

    if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year));
    }

    if (selectedCourses.length > 0) {
      filteredData = filteredData.filter((d) => selectedCourses.includes(d.passedCourses));
    }
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

    const color = colorScale;

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => d.toString()))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(y));

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${-margin.left + 25}, ${height / 2}) rotate(-90)`)
      .attr("fill", "black")
      .attr("font-size", "10px")
      .text("Number of Students");

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
    let filteredData = pivotedData;

    if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year));
    }

    console.log('selectedCourses', selectedCourses)
    if (selectedCourses.length > 0) {
      filteredData = filteredData.filter((d) => selectedCourses.includes(d.passedCourses));
    }

    // ✅ Group Data by Passed Courses
    const groupedData = d3.groups(filteredData, (d) => d.passedCourses);

    // ✅ Convert to Hierarchical Format for Tree Map
    const root = d3
      .hierarchy({
        children: groupedData.map(([passedCourses, students]) => ({
          name: `${passedCourses}`,
          students: d3.sum(students, (d) => d.students),
        })),
      })
      .sum((d) => d.students);

    const studentCounts = root.leaves().map((d) => d.data.students);
    const min = d3.min(studentCounts);
    const max = d3.max(studentCounts);
    const mid = Math.round((min + max) / 2);

    setMinStudents(min);
    setMidStudents(mid);
    setMaxStudents(max);
    // ✅ Sort children descending by student count
    root.children.sort((a, b) => b.data.students - a.data.students);

    // ✅ Create Tree Map Layout
    d3.treemap()
      .size([width, height])
      .padding(3)
      .round(true)(root);

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
      .attr("fill", (d) => {
        const passedCourses = parseInt(d.data.name.replace("Μαθ: ", ""));
        return colorScale(passedCourses);
      })

    // ✅ Conditionally Show Text (Only If Box Is Large Enough)
    cell
      .filter((d) => d.x1 - d.x0 > 50 && d.y1 - d.y0 > 30)
      .each(function (d) {
        const group = d3.select(this);

        group.append("image")
          .attr("href", course)
          .attr("x", 5)
          .attr("y", 5)
          .attr("width", 14)
          .attr("height", 14)

        // Add text next to the icon
        group.append("text")
          .attr("x", 24)
          .attr("y", 16)
          .text(`${d.data.name}`)
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "white");

        // Icon for students
        group.append("image")
          .attr("href", student)
          .attr("x", 5)
          .attr("y", 22)
          .attr("width", 14)
          .attr("height", 14);

        group.append("text")
          .attr("x", 24)
          .attr("y", 33)
          .text(`${d.data.students}`)
          .attr("font-size", "12px")
          .attr("fill", "white");
      });

  };


  useEffect(() => {
    loadExcelData();
  }, []);

  useEffect(() => {
    createChart();
    createTreeMap();
  }, [pivotedData, chartWidth, selectedYears, selectedCourses]);

  useEffect(() => {
    window.addEventListener("resize", updateChartWidth);
    updateChartWidth();
    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);


  return (
    <div className="relative mb-10">
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
      {isCoursePopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow-xl w-96 space-y-4">
            <h2 className="text-lg font-semibold">Filter by Passed Courses</h2>

            <PassedCoursesSelection
              availableCourses={availableCourses}
              selectedCourses={selectedCourses}
              setSelectedCourses={setSelectedCourses}
              onClose={() => setIsCoursePopupOpen(false)}
              filterType={filterType}
              setFilterType={setFilterType}
            />
          </div>
        </div>
      )}



      <div className="flex gap-6 flex-col mx-5">

        <div className="flex gap-4 items-baseline">
          {/* filters */}
          <div className="max-w-max px-4 py-2 text-sm flex items-center gap-6 mt-4 bg-white rounded-lg shadow">
            <p className="font-bold">Filters:</p>
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
            {/* Passed Courses Filter */}
            <div className="flex flex-center">
              <button
                onClick={() => setIsCoursePopupOpen(true)}
                className={`px-4 py-1.5 text-sm shadow bg-gray-300 font-medium ${selectedCourses.length > 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-800'} rounded`}
              >
                Passed Courses
              </button>
              {selectedCourses.length > 0 && (
                <button onClick={() => setSelectedCourses([])} className="px-2 py-2 text-gray-500 rounded">
                  <MdOutlineCleaningServices size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-sm bg-white rounded-lg shadow px-4 py-3.5">
            <span className="text-gray-600">{minPassedCourses}</span>
            <svg width="120" height="12">
              <defs>
                <linearGradient id="legend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={colorScale(minPassedCourses)} />
                  <stop offset="100%" stopColor={colorScale(maxPassedCourses)} />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="120" height="12" fill="url(#legend-gradient)" />
            </svg>
            <span className="text-gray-600">{maxPassedCourses}</span>
            <span className="ml-2 text-gray-500">(Passed Courses)</span>
          </div>

        </div>


        {/* chart */}
        <div className="bg-white shadow shadow-lg rounded-lg">
          <h2 className="text-md text-left pt-2 font-medium mx-6">Students Passing Courses Over the Years</h2>
          <div ref={chartRef} className="w-full relative"></div>
        </div>

        {/* treemap */}
        <div className="bg-white shadow shadow-lg rounded-lg">
          <div className="flex justify-between mx-6">

            <h2 className="text-md text-left pt-2 font-medium text-gray-700">
              <StudentIcon className="w-4 h-4 inline-block align-text-bottom mr-1 fill-gray-700" />
              Student Distribution by&nbsp;
              <CourseIcon className="w-4 h-4 inline-block align-text-bottom mx-1 fill-gray-700" />
              Passed Courses
            </h2>


            {/* Treemap Size Legend */}
            <div className="flex flex-row text-xs text-gray-600 px-4 items-center mt-2">
              <span className="mb-1 text-xm font-medium mr-2">Size by Student(s) Number:</span>
              <div className="flex items-center gap-4">
                {/* Large box */}
                <div className="flex flex-row items-center">
                  <svg width="30" height="30">
                    <rect width="30" height="30" fill="#ddd" />
                  </svg>
                  <span className="ml-1">{maxStudents}+</span>
                </div>
                {/* Medium box */}
                <div className="flex flex-row items-center">
                  <svg width="23" height="23">
                    <rect width="23" height="23" fill="#ddd" />
                  </svg>
                  <span className="ml-1">~{midStudents}</span>
                </div>
                {/* Small box */}
                <div className="flex flex-row items-center">
                  <svg width="12" height="12">
                    <rect width="12" height="12" fill="#ddd" />
                  </svg>
                  <span className="ml-1">{minStudents}</span>
                </div>
              </div>
            </div>
          </div>
          <div ref={treeMapRef} className="w-full relative"></div>
        </div>

      </div>
      <div
        ref={tooltipRef}
        className="fixed bg-white/90 border border-gray-200 text-xs p-2 rounded pointer-events-none opacity-0 z-10 shadow-lg max-w-xs"
      ></div>
    </div>
  );
};

export default ActiveStudentsChart;
