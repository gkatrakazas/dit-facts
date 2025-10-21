import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "../../data/active-students.xlsx";
// import YearSelection from "../../YearSelection"; // Import the new component
// import PassedCoursesSelection from "../../PassedCoursesSelection";
import course from '../../assets/course.svg';
import student from '../../assets/student.svg';
import { useTranslation } from "react-i18next";
import MultiRangeSlider from "../../components/Controls/MultiRangeSlider";
import GradientLegend from "../../components/Legend/GradientLegend";
import SizeLegend from "../../components/Legend/SizeLegend";

const PassingCourses = () => {

  const { t } = useTranslation();

  const [rawData, setRawData] = useState([]);
  const [showRawData, setShowRawData] = useState(false);

  const chartRef = useRef(null);
  const treeMapRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pivotedData, setPivotedData] = useState([]);
  const [chartWidth, setChartWidth] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });
  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);

  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseRange, setCourseRange] = useState({ start: null, end: null });


  const [minPassedCourses, setMinPassedCourses] = useState(0);
  const [maxPassedCourses, setMaxPassedCourses] = useState(52);

  const [highlightedYear, setHighlightedYear] = useState(null);
  const [highlightedCourse, setHighlightedCourse] = useState(null);

  const updateChartWidth = useCallback(() => {
    if (chartRef.current) setChartWidth(chartRef.current.offsetWidth);
  }, []);


  const loadExcelData = async () => {
    const response = await fetch(excelFile);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    setRawData(sheetData); // Save the raw data for the table

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

    setPivotedData(transformedData);
    const years = Array.from(yearsSet).sort();
    setAvailableYears(years);
    setSelectedYears(years);
    setRange({
      start: Math.min(...years),
      end: Math.max(...years),
    });

    const sortedCourses = Array.from(coursesSet).sort((a, b) => a - b);
    setAvailableCourses(sortedCourses);
    setCourseRange({
      start: Math.min(...sortedCourses),
      end: Math.max(...sortedCourses),
    });
    setMinPassedCourses(sortedCourses[0]);
    setMaxPassedCourses(sortedCourses[sortedCourses.length - 1]);

  };

  useEffect(() => {
    if (availableYears.length > 0) {
      setMinYear(Math.min(...availableYears));
      setMaxYear(Math.max(...availableYears));
    }
  }, [availableYears])

  useEffect(() => {
    if (range.start !== null && range.end !== null) {
      const filtered = availableYears.filter(
        (y) => y >= range.start && y <= range.end
      );
      setSelectedYears(filtered);
    }
  }, [range, availableYears]);

  useEffect(() => {
    if (courseRange.start !== null && courseRange.end !== null) {
      const filtered = availableCourses.filter(
        (y) => y >= courseRange.start && y <= courseRange.end
      );
      setSelectedCourses(filtered);
    }
  }, [courseRange, availableCourses]);

  const colorScale = useMemo(
    () => d3.scaleSequential(d3.interpolateOranges).domain([maxPassedCourses, minPassedCourses]),
    [minPassedCourses, maxPassedCourses]
  );
  const createChart = useCallback(() => {
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

    if (highlightedCourse) {
      filteredData = filteredData.filter((d) => d.passedCourses === highlightedCourse);
    } else if (selectedCourses.length > 0) {
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
      .text("Πλήθος φοιτητ(ρι)ών");

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
        <strong>${t("visualization.common.admissionYear")}:</strong> ${year}<br/>
        <strong>${t("visualization.passingCourses.totalStudents")}:</strong> ${totalStudents}<br/>
        <strong>${t("visualization.passingCourses.avgPassingCourses")}:</strong> ${averagePassedCourses}
      `;

      values.forEach((d) => {
        svg
          .append("rect")
          .attr("x", x(year))
          .attr("y", y(cumulative + d.students))
          .attr("width", x.bandwidth())
          .attr("height", y(cumulative) - y(cumulative + d.students))
          .attr("fill", color(d.passedCourses))
          .attr("opacity", highlightedYear && highlightedYear !== year ? 0.2 : 1) // ✅ dim others
          .style("cursor", "pointer")
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
          })
          .on("click", () => {
            setHighlightedYear((prev) => (prev === year ? null : year)); // ✅ toggle highlight
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
  }, [
    pivotedData,
    selectedYears,
    selectedCourses,
    highlightedCourse,
    highlightedYear,
    colorScale,
    t
  ]);

  const createTreeMap = useCallback(() => {
    if (!pivotedData.length) return;

    d3.select(treeMapRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = treeMapRef.current.offsetWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3
      .select(treeMapRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ✅ Apply Year Filter
    let filteredData = pivotedData;

    if (selectedCourses.length > 0) {
      filteredData = filteredData.filter((d) => selectedCourses.includes(d.passedCourses));
    }

    // If a year is highlighted, temporarily filter the treemap to just that year
    if (highlightedYear) {
      filteredData = filteredData.filter((d) => d.year === highlightedYear);
    } else if (selectedYears.length > 0) {
      filteredData = filteredData.filter((d) => selectedYears.includes(d.year));
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
      .attr("opacity", (d) => {
        const passedCourses = parseInt(d.data.name);
        if (!highlightedCourse) return 1;
        return highlightedCourse === passedCourses ? 1 : 0.2;
      })
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        const passedCourses = parseInt(d.data.name);
        setHighlightedCourse((prev) => (prev === passedCourses ? null : passedCourses));
      });


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
  }, [
    pivotedData,
    selectedYears,
    selectedCourses,
    highlightedYear,
    highlightedCourse,
    colorScale
  ]);


  useEffect(() => {
    loadExcelData();
  }, []);

  const allKeys = useMemo(() => {
    const keySet = new Set();
    rawData.forEach((row) => {
      Object.keys(row || {}).forEach((key) => keySet.add(key));
    });
    return Array.from(keySet);
  }, [rawData]);

  useEffect(() => {
    createChart();
    createTreeMap();
  }, [pivotedData, chartWidth, selectedYears, selectedCourses, highlightedYear, highlightedCourse, createChart, createTreeMap]);

  useEffect(() => {
    window.addEventListener("resize", updateChartWidth);
    updateChartWidth();
    return () => window.removeEventListener("resize", updateChartWidth);
  }, [updateChartWidth]);

  return (
    <div>
      <div className="flex flex-col mx-5 mt-5">
        <h2 className="text-xl font-semibold">{t("visualization.passingCourses.title")}</h2>
        <div className="flex flex-row gap-6 w-full">

          <div className="flex flex-col gap-3 mt-6 bg-white p-4 rounded shadow w-60">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex flex-col gap-2 text-sm">
                <h2 className="text-md font-semibold text-md">{t("visualization.common.filters")}</h2>

                <div className="text-sm text-gray-700 font-base">

                  <label className="font-medium">{t("visualization.common.admissionYear")}</label>

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
                  <label className="font-medium">{t("visualization.common.passingCourses")}</label>

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
                {/*

              <CheckboxFilter
                title="Κατάσταση φοίτησης"
                options={statuses}
                selected={selectedStatuses}
                setSelected={setSelectedStatuses}
                descriptions={statusDescriptions}
              />

              <CheckboxFilter
                title="Τρόπος εισαγωγής"
                options={admissionTypes}
                selected={selectedAdmissionTypes}
                setSelected={setSelectedAdmissionTypes}
                descriptions={admissionTypeDescriptions}
              /> */}

              </div>

            </div>
          </div>
          {/* Main content (bubble chart and legend) */}
          <div id="graph" className="flex flex-row bg-white shadow shadow-lg rounded-lg mt-6 w-full">
            {/* Legend */}

            {/* Chart container */}
            <div className="w-full m-4">
              {/* chart */}
              <div>
                <div className="flex flex-row justify-between">
                  <h2 className="text-lg text-left pt-2 font-medium mx-6">{t("visualization.passingCourses.barChartTitle")}</h2>
                  <div className="flex gap-4 items-baseline">
                    {/* Legend */}

                    {/* <div className="text-sm flex flex-col justify-center items-left gap-2 text-sm bg-white border-gray-300 text-gray-600 border-[1px] shadow-sm m-2 px-2 py-2 mx-6">
                      <div className="mb-1">
                        <p className="">{t("chart.activeStudents.legend.passed_courses_title")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{minPassedCourses}</span>
                        <svg width="150" height="12">
                          <defs>
                            <linearGradient id="legend-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={colorScale(minPassedCourses)} />
                              <stop offset="100%" stopColor={colorScale(maxPassedCourses)} />
                            </linearGradient>
                          </defs>
                          <rect x="0" y="0" width="150" height="12" fill="url(#legend-gradient)" />
                        </svg>
                        <span className="text-gray-600">{maxPassedCourses}</span>
                      </div>
                    </div> */}

                  </div>
                </div>
                <div ref={chartRef} className="w-full relative"></div>
              </div>

              <div className="border-t border-gray-300 py-2 mx-6"></div>
              {/* treemap */}
              <div className="">
                <div className="flex mx-6">

                  <div className="flex flex-row justify-between w-full">

                    <h2 className="text-lg text-left pt-2 font-medium text-gray-700">
                      {t("visualization.passingCourses.ThreeMapTitle")}
                    </h2>

                    {/* <div className="text-sm flex flex-col justify-center items-left gap-2 text-sm bg-white border-gray-300 text-gray-600 border-[1px] shadow-sm mx-2 px-2 py-2">
                      <div className="mb-1">
                        <p className="">{t("chart.activeStudents.legend.students_per_box")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm  text-gray-600 flex items-center gap-4">
                          <div className="flex flex-row items-center">
                            <svg width="12" height="12"><rect width="12" height="12" fill="#ddd" /></svg>
                            <span className="ml-1">5</span>
                          </div>
                          <div className="flex flex-row items-center">
                            <svg width="23" height="23"><rect width="23" height="23" fill="#ddd" /></svg>
                            <span className="ml-1">50</span>
                          </div>
                          <div className="flex flex-row items-center">
                            <svg width="30" height="30"><rect width="30" height="30" fill="#ddd" /></svg>

                            <span className="ml-1">500</span>
                          </div>
                        </div>
                      </div>
                    </div> */}

                  </div>
                  {/* Treemap Size Legend */}
                </div>
                <div ref={treeMapRef} className="w-full relative"></div>
              </div>

            </div>
          </div>

          <div className="max-w-[13%] mt-6 w-full flex flex-col gap-2">

            <GradientLegend
              title={t("visualization.common.passingCourses")}
              startLabel={minPassedCourses}
              endLabel={maxPassedCourses}
              startColor={colorScale(minPassedCourses)}
              endColor={colorScale(maxPassedCourses)}
            />

            <SizeLegend
              shape="rect"
              steps={[5, 50, 500]}
              range={[12, 30]} // side lengths
              label={t('visualization.passingCourses.sizeLegend')}
              direction="row"
            />
          </div>
        </div>
      </div>


      <div
        ref={tooltipRef}
        className="fixed bg-white/90 border border-gray-200 text-xs p-2 rounded pointer-events-none opacity-0 z-10 shadow-lg max-w-xs"
      ></div>


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
                  {rawData.map((row, i) => (
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

    </div>
  );
};

export default PassingCourses;
