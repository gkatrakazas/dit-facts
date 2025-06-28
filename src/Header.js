import React from "react";
import { Link } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";

const Header = () => {
  return (
    <header className="w-full p-4 bg-white flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <img src="/logo.png" alt="DI Visualization Logo" className="h-12 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/">DIT Visualizations</Link>
        </h1>
      </div>
      <LanguageSelector />
    </header>
  );
};

export default Header;
