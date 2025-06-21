import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as XLSX from "xlsx";
import excelFile from "./data/di_stats.xlsx";
import { useTranslation } from "react-i18next";
import MultiRangeSlider from "./components/MultiRangeSlider";

const getColorByInactivity = (lastActionDate) => {
  const yearsInactive = (new Date() - new Date(lastActionDate)) / (1000 * 60 * 60 * 24 * 365.25);

  if (yearsInactive > 20) return "#8B0000";
  if (yearsInactive > 10) return "#FF4500";
  if (yearsInactive > 5) return "#FFA500";
  if (yearsInactive > 2) return "#FFD700";
  return "#32CD32";
};


const getInactivityCategory = (yearsInactive) => {
  if (yearsInactive > 20) return ">20";
  if (yearsInactive > 10) return "10–20";
  if (yearsInactive > 5) return "5–10";
  if (yearsInactive > 2) return "2–5";
  return "<2";
};

const getTooltipHtml = (d) => {
  const fieldsToShow = [
    { label: "Έτος τελευταίας ενέργειας", value: d.data.year },
    { label: "Πλήθος μαθημάτων", value: d.data.r },
    { label: "Ημερομηνία τελευταίας ενέργειας", value: d.data.lastAction },
    { label: "Τρόπος εισαγωγής", value: d.data.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"] },
    { label: "Έτος εγγραφής", value: d.data.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] },
    { label: "Κατάσταση", value: d.data.raw?.["ΚΑΤΑΣΤΑΣΗ"] },
    { label: "Έτη ανενεργός", value: d.data.size.toFixed(1) },
  ];

  return fieldsToShow
    .map(({ label, value }) => `<b>${label}:</b> ${value ?? "-"}`)
    .join("<br/>");
};



const ActiveStudentsChart = () => {
  const { t } = useTranslation();

  const [rawData, setRawData] = useState([]);
  const [inactiveBubbleData, setInactiveBubbleData] = useState([]);
  const [nestedStudentData, setNestedStudentData] = useState(null);
  const [selectedBubble, setSelectedBubble] = useState(null);

  const packedRef = useRef(null);
  const yearPackedRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const yearContainerRef = useRef(null);

  const categoryPackedRef = useRef(null);
  const categoryContainerRef = useRef(null);

  //////////////////// about year filter
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [range, setRange] = useState({ start: null, end: null });

  const [minYear, setMinYear] = useState(null);
  const [maxYear, setMaxYear] = useState(null);
  ////////////////////

  const [courseRange, setCourseRange] = useState({ start: null, end: null });
  const [availableCourses, setAvailableCourses] = useState([]);


  const [viewMode, setViewMode] = useState("individual"); // 'individual' or 'grouped'
  const [groupedMode, setGroupedMode] = useState("byYear"); // only used when grouped


  const groupedModeConfig = {
    byYear: {
      label: "Ανά έτος εγγραφής",
      groupBy: (d) => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"],
      labelKey: "year",
      getLabel: (d) => d.data.year,
      containerRef: yearContainerRef,
      packedRef: yearPackedRef,
    },
    byCategory: {
      label: "Ανά κατηγορία ανενεργών",
      groupBy: (d) => getInactivityCategory(d.size),
      labelKey: "category",
      getLabel: (d) => d.data.category,
      containerRef: categoryContainerRef,
      packedRef: categoryPackedRef,
    },
  };

  useEffect(() => {
    console.log('availableYears', availableYears)
    if (availableYears.length > 0) {
      setMinYear(Math.min(...availableYears));
      setMaxYear(Math.max(...availableYears));
    }
  }, [availableYears])
  // 

  useEffect(() => {
    const observeTarget =
      viewMode === "all"
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
    const handleClickOutside = (event) => {
      const chartContainers = [containerRef.current, yearContainerRef.current];
      const detailsPanel = document.querySelector(".text-sm.space-y-1")?.parentElement;

      const clickedInside = chartContainers.some(ref =>
        ref && ref.contains(event.target)
      ) || (detailsPanel && detailsPanel.contains(event.target));

      if (!clickedInside) {
        setSelectedBubble(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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




      const bubbles = sheetData
        .filter(row => !row["ΕΤΟΣ ΑΠΟΦΟΙΤΗΣΗΣ"])
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


          month =  parseInt(str.slice(4, 6))
          day = parseInt(str.slice(6, 7));

          const lastActionDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
          const yearsInactive = (today - lastActionDate) / (1000 * 60 * 60 * 24 * 365.25);

          if (!str || !year || !month || !day || !lastActionDate) {
            console.log('-->', str, year, month, day)
            console.log('--> lastActionDate', lastActionDate)
            console.log('-->', row)
          }

          return {
            r: row["ΠΛΗΘΟΣ ΜΑΘΗΜΑΤΩΝ"] || 0,
            size: yearsInactive || 0.5,
            year,
            lastActionDate,
            lastAction: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            raw: row
          };
        })
        .filter(d => !isNaN(d.lastActionDate));

      const groupedByYear = d3.group(bubbles, d => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]);
      const nestedHierarchy = {
        children: [...groupedByYear.entries()].map(([year, students]) => ({
          year,
          children: students.map(s => ({ ...s, value: 1 }))
        }))
      };

      // 🔽 Add this to log 2024 students
      // console.log("2024 Students", bubbles.filter(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] === 2024));
      console.log('bubbles', bubbles)
      setRawData(sheetData);
      setInactiveBubbleData(bubbles);
      setNestedStudentData(nestedHierarchy);

      const years = [...new Set(bubbles.map(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]))].sort((a, b) => a - b);
      setAvailableYears(years);
      setSelectedYears(years); // Default to all years visible

      setRange({
        start: Math.min(...years),
        end: Math.max(...years),
      });

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
    const filteredData = inactiveBubbleData.filter(b =>
      selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
      b.r >= courseRange.start &&
      b.r <= courseRange.end
    );
    if (!filteredData.length || viewMode !== "individual") return;

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

    const tooltip = d3.select("#bubble-tooltip");

    const sortedData = [...filteredData].sort(
      (a, b) => new Date(a.lastAction) - new Date(b.lastAction)
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
      .attr("fill", d => getColorByInactivity(d.data.lastAction))
      .attr("opacity", d =>
        selectedBubble ? (d.data === selectedBubble ? 1 : 0.2) : 1
      )
      .attr("stroke", "#222")
      .attr("stroke-width", 0.3)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("filter", "url(#hover-shadow)");

        tooltip
          .style("opacity", 1)
          .html(getTooltipHtml(d));
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.clientX + 0}px`)
          .style("top", `${event.clientY + 0}px`);
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

            return selectedBubble ? (isSelected ? 1 : 0.2) : 1;
          });

        tooltip.style("opacity", 0);
      })

      .on("click", (_, d) => {
        setSelectedBubble(d.data); // 🟢 Store data for details panel
      });
  }, [inactiveBubbleData, viewMode, groupedMode, dimensions, selectedYears, courseRange, selectedBubble]);


  // useEffect(() => {
  //   if (!inactiveBubbleData.length || selectedYears.length === 0 || courseRange.start === null || courseRange.end === null || !(viewMode === "grouped" && groupedMode === "byYear")) return;

  //   const fallbackSize = 800;
  //   const width = dimensions.width || fallbackSize;
  //   const height = dimensions.height || fallbackSize;

  //   if (!width || !height || !yearPackedRef.current) return;

  //   d3.select(yearPackedRef.current).selectAll("*").remove();

  //   const filteredData = inactiveBubbleData.filter(b =>
  //     selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
  //     b.r >= courseRange.start &&
  //     b.r <= courseRange.end
  //   );

  //   const groupedByYear = d3.group(filteredData, d => d.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]);

  //   const filteredHierarchy = {
  //     children: [...groupedByYear.entries()].map(([year, students]) => ({
  //       year,
  //       children: students.map(s => ({ ...s, value: 1 }))
  //     }))
  //   };

  //   const root = d3
  //     .hierarchy(filteredHierarchy)
  //     .sum(d => d.value || 0)
  //     .sort((a, b) => b.value - a.value);


  //   d3.pack()
  //     .size([width, height])
  //     .padding(8)(root);

  //   // const scaleX = 1.3; // widen the layout horizontally
  //   // root.descendants().forEach(d => {
  //   //   d.x = (d.x - width / 2) * scaleX + width / 2;
  //   // });


  //   // Apply extra space *within each year group*
  //   root.children.forEach(group => {
  //     // Shrink the available radius by 10%
  //     group.r *= 0.8;

  //     // Move children closer to the center
  //     group.children.forEach(child => {
  //       const dx = child.x - group.x;
  //       const dy = child.y - group.y;
  //       const scale = 0.9; // 90% shrink
  //       child.x = group.x + dx * scale;
  //       child.y = group.y + dy * scale;
  //     });
  //   });


  //   const svg = d3
  //     .select(yearPackedRef.current)
  //     .append("svg")
  //     .attr("viewBox", `0 0 ${width} ${height}`)
  //     .attr("width", "100%")
  //     .attr("height", height);

  //   svg.append("rect")
  //     .attr("width", width)
  //     .attr("height", height)
  //     .attr("fill", "transparent")
  //     .on("click", () => {
  //       setSelectedBubble(null); // Clear when background is clicked
  //     });

  //   const tooltip = d3.select("#bubble-tooltip");


  //   const defs = svg.append("defs");

  //   const filter = defs.append("filter")
  //     .attr("id", "hover-shadow")
  //     .attr("x", "-50%")
  //     .attr("y", "-50%")
  //     .attr("width", "200%")
  //     .attr("height", "200%");

  //   filter.append("feDropShadow")
  //     .attr("dx", 0)
  //     .attr("dy", 0)
  //     .attr("stdDeviation", 3)
  //     .attr("flood-color", "#000")
  //     .attr("flood-opacity", 0.3);

  //   // ⬇️ Fake parent bubbles (background)
  //   // ⬇️ Fake parent ovals (background)
  //   svg
  //     .selectAll("circle.fake-year")
  //     .data(root.descendants().filter(d => d.depth === 1))
  //     .join("circle")
  //     .attr("class", "fake-year")
  //     .attr("cx", d => d.x)
  //     .attr("cy", d => d.y)
  //     .attr("r", d => d.r + 3)
  //     .attr("fill", "#F9F9F9")
  //     .attr("stroke", "lightgray")
  //     .attr("stroke-width", 1);

  //   // 🟢 Inner student bubbles
  //   svg
  //     .selectAll("circle.student")
  //     .data(root.leaves())
  //     .join("circle")
  //     .attr("class", "student")
  //     .attr("cx", d => d.x)
  //     .attr("cy", d => d.y)
  //     .attr("r", d => d.r)
  //     .attr("fill", d => getColorByInactivity(d.data.lastAction))
  //     .attr("opacity", d => {
  //       console.log('selectedBubble', selectedBubble);
  //       console.log('data', d.data);
  //       if (d.depth !== 2) return 1;
  //       return selectedBubble ? (d.data.raw === selectedBubble.raw ? 1 : 0.2) : 1;
  //     })
  //     .attr("stroke", "#1E3A8A")
  //     .attr("stroke-width", 0.5)
  //     .on("mouseover", (event, d) => {
  //       d3.select(event.currentTarget)
  //         .transition()
  //         .duration(200)
  //         .attr("filter", "url(#hover-shadow)")
  //         .attr("opacity", 1); // ⬅️ Always 1 on hover

  //       tooltip
  //         .style("opacity", 1)
  //         .html(getTooltipHtml(d));
  //     })

  //     .on("mousemove", (event) => {
  //       tooltip
  //         .style("left", `${event.clientX + 0}px`)
  //         .style("top", `${event.clientY + 0}px`);
  //     })
  //     .on("mouseout", (event, d) => {
  //       d3.select(event.currentTarget)
  //         .transition()
  //         .duration(0)
  //         .attr("filter", null)
  //         .attr("opacity", () => {
  //           const isSelected =
  //             selectedBubble &&
  //             d.data.raw === selectedBubble.raw

  //           return selectedBubble ? (isSelected ? 1 : 0.2) : 1;
  //         });

  //       tooltip.style("opacity", 0);
  //     })

  //     .on("click", (_, d) => {
  //       setSelectedBubble(d.data); // 🟢 Store data for details panel
  //     });
  //   // 🔵 Top-aligned year labels
  //   svg
  //     .selectAll("text.year-label")
  //     .data(root.descendants().filter(d => d.children && d.depth === 1))
  //     .join("text")
  //     .attr("class", "year-label")
  //     .attr("x", d => d.x - 10)
  //     .attr("y", d => d.y - d.r + (-3)) // ⬅️ aligned near top
  //     .attr("text-anchor", "middle")
  //     .attr("font-size", d => `${Math.max(10, d.r / 5, 14)}px`)
  //     .attr("font-weight", "800")
  //     .attr("fill", "#gray")
  //     .attr("pointer-events", "none")
  //     .style("paint-order", "stroke")
  //     .style("stroke", "#ffffff")
  //     .style("stroke-width", "3px")
  //     .text(d => d.data.year);
  // }, [nestedStudentData, viewMode, dimensions, selectedYears, courseRange, selectedBubble]);


  // useEffect(() => {
  //   if (
  //     !(viewMode === "grouped" && groupedMode === "byCategory") ||
  //     !inactiveBubbleData.length ||
  //     !selectedYears.length ||
  //     courseRange.start === null ||
  //     courseRange.end === null ||
  //     !categoryPackedRef.current ||
  //     !dimensions.width
  //   )
  //     return;

  //   d3.select(categoryPackedRef.current).selectAll("*").remove();

  //   const filtered = inactiveBubbleData.filter(
  //     (b) =>
  //       selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
  //       b.r >= courseRange.start &&
  //       b.r <= courseRange.end
  //   );

  //   const grouped = d3.group(filtered, (d) => getInactivityCategory(d.size));

  //   const hierarchy = {
  //     children: [...grouped.entries()].map(([cat, students]) => ({
  //       category: cat,
  //       children: students.map((s) => ({ ...s, value: 1 })),
  //     })),
  //   };

  //   const width = dimensions.width;
  //   const height = dimensions.height;

  //   const root = d3
  //     .hierarchy(hierarchy)
  //     .sum((d) => d.value || 0)
  //     .sort((a, b) => b.value - a.value);

  //   d3.pack()
  //     .size([width, height])
  //     .padding(8)(root);

  //   // Shrink each group and reposition children
  //   root.children.forEach((group) => {
  //     group.r *= 0.8;
  //     group.children.forEach((child) => {
  //       const dx = child.x - group.x;
  //       const dy = child.y - group.y;
  //       const scale = 0.9;
  //       child.x = group.x + dx * scale;
  //       child.y = group.y + dy * scale;
  //     });
  //   });

  //   const svg = d3
  //     .select(categoryPackedRef.current)
  //     .append("svg")
  //     .attr("viewBox", `0 0 ${width} ${height}`)
  //     .attr("width", "100%")
  //     .attr("height", height);

  //   svg.append("rect")
  //     .attr("width", width)
  //     .attr("height", height)
  //     .attr("fill", "transparent")
  //     .on("click", () => setSelectedBubble(null));

  //   const tooltip = d3.select("#bubble-tooltip");

  //   svg
  //     .selectAll("circle.parent")
  //     .data(root.children)
  //     .join("circle")
  //     .attr("cx", (d) => d.x)
  //     .attr("cy", (d) => d.y)
  //     .attr("r", (d) => d.r + 3)
  //     .attr("fill", "#F9F9F9")
  //     .attr("stroke", "#ccc");

  //   svg
  //     .selectAll("circle.student")
  //     .data(root.leaves())
  //     .join("circle")
  //     .attr("cx", (d) => d.x)
  //     .attr("cy", (d) => d.y)
  //     .attr("r", (d) => d.r)
  //     .attr("fill", (d) => getColorByInactivity(d.data.lastAction))
  //     .attr("opacity", (d) =>
  //       selectedBubble ? (d.data.raw === selectedBubble.raw ? 1 : 0.2) : 1
  //     )
  //     .attr("stroke", "#1E3A8A")
  //     .attr("stroke-width", 0.5)
  //     .on("mouseover", (event, d) => {
  //       d3.select(event.currentTarget)
  //         .transition()
  //         .duration(200)
  //         .attr("filter", "url(#hover-shadow)")
  //         .attr("opacity", 1);

  //       tooltip.style("opacity", 1).html(getTooltipHtml(d));
  //     })
  //     .on("mousemove", (event) => {
  //       tooltip
  //         .style("left", `${event.clientX}px`)
  //         .style("top", `${event.clientY}px`);
  //     })
  //     .on("mouseout", (event, d) => {
  //       d3.select(event.currentTarget)
  //         .transition()
  //         .duration(0)
  //         .attr("filter", null)
  //         .attr("opacity", () => {
  //           const isSelected =
  //             selectedBubble && d.data.raw === selectedBubble.raw;
  //           return selectedBubble ? (isSelected ? 1 : 0.2) : 1;
  //         });

  //       tooltip.style("opacity", 0);
  //     })
  //     .on("click", (_, d) => setSelectedBubble(d.data));

  //   svg
  //     .selectAll("text.label")
  //     .data(root.children)
  //     .join("text")
  //     .attr("x", (d) => d.x)
  //     .attr("y", (d) => d.y - d.r - 5)
  //     .attr("text-anchor", "middle")
  //     .attr("font-size", (d) => `${Math.max(10, d.r / 5, 14)}px`)
  //     .attr("font-weight", "bold")
  //     .attr("fill", "#444")
  //     .style("paint-order", "stroke")
  //     .style("stroke", "#fff")
  //     .style("stroke-width", "3px")
  //     .text((d) => d.data.category);
  // }, [viewMode, groupedMode, inactiveBubbleData, dimensions, selectedYears, courseRange, selectedBubble]);

  const renderGroupedBubbles = (configKey) => {
    const config = groupedModeConfig[configKey];
    if (!config || !inactiveBubbleData.length || !dimensions.width || !config.packedRef.current) return;

    const filtered = inactiveBubbleData.filter(
      (b) =>
        selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]) &&
        b.r >= courseRange.start &&
        b.r <= courseRange.end
    );

    const grouped = d3.group(filtered, config.groupBy);
    const hierarchy = {
      children: [...grouped.entries()].map(([key, items]) => ({
        [config.labelKey]: key,
        children: items.map((s) => ({ ...s, value: 1 })),
      })),
    };

    const root = d3
      .hierarchy(hierarchy)
      .sum((d) => d.value || 0)
      .sort((a, b) => b.value - a.value);

    d3.pack()
      .size([dimensions.width, dimensions.height])
      .padding(8)(root);

    root.children.forEach((group) => {
      group.r *= 0.8;
      group.children.forEach((child) => {
        const dx = child.x - group.x;
        const dy = child.y - group.y;
        const scale = 0.9;
        child.x = group.x + dx * scale;
        child.y = group.y + dy * scale;
      });
    });

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

    const tooltip = d3.select("#bubble-tooltip");

    svg
      .selectAll("circle.parent")
      .data(root.children)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r + 3)
      .attr("fill", "#F9F9F9")
      .attr("stroke", "#ccc");

    svg
      .selectAll("circle.student")
      .data(root.leaves())
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => getColorByInactivity(d.data.lastAction))
      .attr("opacity", (d) =>
        selectedBubble ? (d.data.raw === selectedBubble.raw ? 1 : 0.2) : 1
      )
      .attr("stroke", "#1E3A8A")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("filter", "url(#hover-shadow)")
          .attr("opacity", 1);

        tooltip.style("opacity", 1).html(getTooltipHtml(d));
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
            selectedBubble && d.data.raw !== selectedBubble.raw ? 0.2 : 1
          );
        tooltip.style("opacity", 0);
      })
      .on("click", (_, d) => setSelectedBubble(d.data));

    svg
      .selectAll("text.label")
      .data(root.children)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y - d.r - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => `${Math.max(10, d.r / 5, 14)}px`)
      .attr("font-weight", "bold")
      .attr("fill", "#444")
      .style("paint-order", "stroke")
      .style("stroke", "#fff")
      .style("stroke-width", "3px")
      .text(config.getLabel);
  };


  useEffect(() => {
    if (viewMode === "grouped") {
      renderGroupedBubbles(groupedMode);
    }
  }, [viewMode, groupedMode, inactiveBubbleData, dimensions, selectedYears, courseRange, selectedBubble]);

  return (
    <div className="mb-10">
      <div className="flex flex-col mx-5 mt-5">
        <h2 className="text-xl font-semibold">Visualization of Student Inactivity and Enrollment Years</h2>

        <div className="flex flex-row gap-6 w-full">
          {/* Sidebar: Display options */}
          <div className="flex flex-col gap-4 mt-6 bg-white p-4 rounded shadow">
            <h2 className="text-md font-semibold">Επιλογή προβολής</h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Επιλογή προβολής</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="individual">Όλοι οι φοιτητές</option>
                <option value="grouped">Ομαδοποιημένα</option>
              </select>

              {viewMode === "grouped" && (
                <select
                  value={groupedMode}
                  onChange={(e) => setGroupedMode(e.target.value)}
                  className="px-4 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="byYear">Ανά έτος εγγραφής</option>
                  <option value="byCategory">Ανά κατηγορία ανενεργών</option>
                </select>
              )}
            </div>


            <div className="mt-4 ">
              <h2 className="text-md font-semibold mb-2">Φίλτρα</h2>

              <label className="text-sm text-gray-700 font-medium">Έτος εγγραφής</label>

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

              <label className="text-sm text-gray-700 font-medium mt-4">Πλήθος μαθημάτων</label>

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

          </div>

          {/* Main content (bubble chart and legend) */}
          <div className="flex flex-row bg-white shadow shadow-lg rounded-lg mt-6 w-full">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 items-baseline">
              <div className="flex flex-col justify-center items-left gap-2 text-sm bg-white border-gray-300 border-[1px] shadow-sm m-4 px-2 py-3.5">
                <span className="text-gray-600">Έτη Ανενεργός</span>
                <div className="flex flex-col gap-2 mt-2 text-sm flex-wrap">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#8B0000]"></div> &gt; 20</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#FF4500]"></div> 10–20</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#FFA500]"></div> 5–10</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#FFD700]"></div> 2–5</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-[#32CD32]"></div> &lt; 2</div>
                </div>
              </div>
            </div>

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
                  <div ref={yearContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                    <div ref={yearPackedRef} className="absolute inset-0"></div>
                  </div>
                </div>
              )}
              {(viewMode === "grouped" && groupedMode === "byCategory") && (
                <div ref={categoryContainerRef} style={{ height: "90vh", width: "100%" }} className="relative">
                  <div ref={categoryPackedRef} className="absolute inset-0" />
                </div>
              )}
            </div>
          </div>


          <div className="max-w-[20%] mt-6 w-full">
            <div className="p-2 relative w-full bg-white shadow shadow-lg rounded-lg w-full">
              <p className="text-sm font-medium">
                Σύνολο Φοιτητών: {inactiveBubbleData.filter(b => selectedYears.includes(b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"])).length}
              </p>
            </div>
            {(viewMode === "grouped" && groupedMode === "byYear") && (
              <div className="relative w-full p-2 text-sm bg-white shadow shadow-lg rounded-lg mt-2">
                <div className="text-sm">
                  <p className="font-semibold mb-1">Φοιτητές ανά έτος:</p>
                  <div className="max-h-40 overflow-y-auto pr-1">
                    <ul className="space-y-1">
                      {selectedYears.map(year => {
                        const count = inactiveBubbleData.filter(b => b.raw["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"] === year).length;
                        return (
                          <li key={year} className="flex justify-between border-b border-gray-100 pb-1 mr-2">
                            <span className="text-gray-700">{year}: </span>
                            <span className="text-gray-900 font-semibold">{count}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
                <p className="mb-2"><b>Επιλεγμένος φοιτητής</b></p>
                <div className="text-sm space-y-1">
                  <p><span className="font-semibold">Ημ/νία τελευταίας ενέργειας:</span> {selectedBubble.lastAction}</p>
                  <p><span className="font-semibold">Έτη ανενεργός:</span> {selectedBubble.size.toFixed(1)}</p>
                  <p><span className="font-semibold">Έτος εγγραφής:</span> {selectedBubble.raw?.["ΕΤΟΣ ΕΓΓΡΑΦΗΣ"]}</p>
                  <p><span className="font-semibold">Πλήθος μαθημάτων:</span> {selectedBubble.r}</p>
                  <p><span className="font-semibold">Κατάσταση:</span> {selectedBubble.raw?.["ΚΑΤΑΣΤΑΣΗ"]}</p>
                  <p><span className="font-semibold">Τρόπος εισαγωγής:</span> {selectedBubble.raw?.["ΤΡΟΠΟΣ ΕΙΣΑΓΩΓΗΣ"]}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tooltip */}
        <div
          id="bubble-tooltip"
          className="fixed text-xs bg-white border border-gray-300 text-gray-900 px-2 py-1 rounded shadow-lg z-50 opacity-0 pointer-events-none whitespace-pre-line"
        ></div>
      </div>
    </div>
  );
};

export default ActiveStudentsChart;
