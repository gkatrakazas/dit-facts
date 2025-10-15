import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { FaAngleDown } from "react-icons/fa";

const Header = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // List of visualization routes
  const visualizationRoutes = [
    "/inactive-students",
    "/graduation-timelines",
    "/graduates-duration",
    "/passing-courses",
  ];

  // Determine if a child visualization route is active
  const isVisualizationActive = visualizationRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseClass =
    "block px-4 py-2 font-medium text-md rounded-md transition-colors duration-200";
  const activeClass = "bg-secondary text-white";
  const inactiveClass = "text-gray-700 hover:bg-secondary hover:text-white";

  // Handle hover (desktop)
  const handleMouseEnter = () => {
    if (window.innerWidth > 768) setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 768) setIsOpen(false);
  };

  return (
    <header className="w-full p-4 bg-white flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <img src="/logo.png" alt="DI Visualization Logo" className="h-12 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/">DIT {t("header.visualizations")}</Link>
        </h1>
      </div>

      <nav className="flex gap-4 items-center">
        {/* Home link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          {t("header.home")}
        </NavLink>

        {/* Dropdown menu */}
        <div
          className="relative"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex px-4 py-2 font-medium items-center gap-2 text-md rounded-md transition-colors duration-200 ${
              isOpen || isVisualizationActive
                ? activeClass
                : "text-gray-700 hover:bg-secondary hover:text-white"
            }`}
          >
            {t("header.visualizations")}
            <FaAngleDown
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isOpen && (
            <ul className="absolute left-0 mt-1 w-80 bg-white border rounded-md shadow-lg z-10">
              <li>
                <NavLink
                  to="/inactive-students"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.inactiveStudents.title")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/graduation-timelines"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.graduationTimelines.title")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/graduates-duration"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.graduatesDuration.title")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/passing-courses"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.passingCourses.title")}
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </nav>

      <LanguageSelector />
    </header>
  );
};

export default Header;
