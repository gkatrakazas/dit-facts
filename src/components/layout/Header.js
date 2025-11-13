import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { FaAngleDown, FaBars, FaTimes } from "react-icons/fa"; 

const Header = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
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

  useEffect(() => {
    setIsOpen(false);
    setIsMobileMenuOpen(false); 
  }, [location.pathname]);

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

  const handleMobileVizToggle = () => {
    setIsOpen((prev) => !prev);
  }


  return (
    <header className="w-full p-4 bg-white flex items-center justify-between shadow-md relative z-20">
      <div className="flex items-center">
        <img src="/logo.png" alt="DI Visualization Logo" className="h-12 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/">DIT Facts</Link>
        </h1>
      </div>

      <nav className="hidden md:flex gap-4 items-center">
        {/* Home link */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          {t("header.home")}
        </NavLink>

        {/* Desktop Visualizations Dropdown */}
        <div
          className="relative"
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`flex px-4 py-2 font-medium items-center gap-2 text-md rounded-md transition-colors duration-200 ${isOpen || isVisualizationActive
                ? activeClass
                : "text-gray-700 hover:bg-secondary hover:text-white"
              }`}
          >
            {t("header.visualizations")}
            <FaAngleDown
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                }`}
            />
          </button>

          {isOpen && (
            <ul className="absolute left-0 w-80 bg-white border rounded-md shadow-lg z-10">
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
                  to="/passing-courses"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.passingCourses.title")}
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
                  to="/graduation-timelines"
                  className={({ isActive }) =>
                    `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                  }
                >
                  {t("visualization.graduationTimelines.title")}
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </nav>
      <div className="flex items-center gap-4">
     
        <LanguageSelector className="text-sm px-0" />
        
      
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-700 hover:text-secondary transition-colors duration-200 focus:outline-none md:hidden"
          aria-label={isMobileMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer (Off-Canvas) */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex flex-col h-full">

          <div className="flex justify-end items-center pb-4 border-b">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-700 hover:text-secondary focus:outline-none"
              aria-label={t("common.closeMenu")}
            >
              <FaTimes size={24} />
            </button>
          </div>

          {/* Navigation Links in Drawer */}
          <nav className="flex flex-col gap-2 py-4 flex-grow overflow-y-auto">
            {/* Home link */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${baseClass} ${isActive ? activeClass : inactiveClass}`
              }
            >
              {t("header.home")}
            </NavLink>

            {/* Mobile Visualizations Dropdown */}
            <div className="relative">
              <button
                onClick={handleMobileVizToggle} 
                className={`flex px-4 py-2 font-medium items-center justify-between w-full gap-2 text-md rounded-md transition-colors duration-200 ${isOpen || isVisualizationActive
                    ? activeClass
                    : inactiveClass
                  }`}
              >
                {t("header.visualizations")}
                <FaAngleDown
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
              </button>

              {isOpen && (
                <ul className="pl-4 py-2 space-y-1">
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
                      to="/passing-courses"
                      className={({ isActive }) =>
                        `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                      }
                    >
                      {t("visualization.passingCourses.title")}
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
                      to="/graduation-timelines"
                      className={({ isActive }) =>
                        `${baseClass} text-sm ${isActive ? activeClass : inactiveClass}`
                      }
                    >
                      {t("visualization.graduationTimelines.title")}
                    </NavLink>
                  </li>
                </ul>
              )}
            </div>

          </nav>
        </div>
      </div>
       {/* Backdrop to close drawer on outside click */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;