import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const EchelD3Visualization = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Example Echel data
    const data = [
      { name: "Echel 1", value: 65 },
      { name: "Echel 2", value: 59 },
      { name: "Echel 3", value: 80 },
      { name: "Echel 4", value: 81 },
      { name: "Echel 5", value: 56 },
    ];

    // Set up dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 50 };

    // Create SVG
    const svg = d3
      .select(chartRef.current)
      .attr("width", width)
      .attr("height", height);

    // Clear previous chart
    svg.selectAll("*").remove();

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Append x-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // Append y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);

    // Draw bars
    svg
      .selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.name))
      .attr("y", (d) => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - margin.bottom - yScale(d.value))
      .attr("fill", "steelblue");

    // Add labels
    svg
      .selectAll(".label")
      .data(data)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => xScale(d.name) + xScale.bandwidth() / 2)
      .attr("y", (d) => yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .text((d) => d.value)
      .style("fill", "black")
      .style("font-size", "12px");
  }, []);

  return (
    <div className="flex justify-center items-center p-4 bg-gray-100 rounded-md shadow-lg">
      <svg ref={chartRef} className="bg-white rounded-md"></svg>
    </div>
  );
};

export default EchelD3Visualization;
