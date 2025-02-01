import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="shadow-md w-full p-4 flex items-center justify-center">
      <div className="flex items-center">
        <img src="/logo.png" alt="DI Visualization Logo" className="h-16 mr-4" />
        <h1 className="text-3xl font-bold text-gray-800">
          <Link to="/">DI Visualizations</Link>
        </h1>
      </div>
    </header>
  );
};

export default Header;
