import React from "react";
import { useNavigate } from "react-router-dom";

// Sample visualizations data
const visualizations = [
  { id: 1, title: "Echel Performance", description: "Bar chart of performance data.", route: "/echel-performance" },
  { id: 2, title: "Sales Trends", description: "Line chart showing sales over time.", route: "/sales-trends" },
  { id: 3, title: "Demographics", description: "Pie chart of user demographics.", route: "/demographics" },
  { id: 4, title: "Active Students Chart", description: "Line chart showing active students over time.", route: "/active-students-chart" }, // New chart

];

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-100">
      <div className="p-6 flex flex-col items-center">
        <p className="text-lg text-gray-600 mb-8 text-center">
          Welcome to DI Visualizations! Explore interactive charts and insights. Click on a visualization to dive deeper.
        </p>
        {/* Visualization List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {visualizations.map((viz) => (
            <div
              key={viz.id}
              className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => navigate(viz.route)}
            >
              <h2 className="text-xl font-semibold mb-2">{viz.title}</h2>
              <p className="text-gray-600 mb-4">{viz.description}</p>
              <button className="text-blue-500 hover:text-blue-700 font-medium">View Visualization →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
