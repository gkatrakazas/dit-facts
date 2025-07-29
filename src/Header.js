import React from "react";
import { Link } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { FaAngleDown } from "react-icons/fa";

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="w-full p-4 bg-white flex items-center justify-between shadow-md">
      <div className="flex items-center">
        <img src="/logo.png" alt="DI Visualization Logo" className="h-12 mr-4" />
        <h1 className="text-2xl font-bold text-gray-800">
          <Link to="/">DIT Visualizations</Link>
        </h1>
      </div>
      <nav className="flex gap-4 items-center">
        <Link
          to="/"
          className="block px-4 py-2 font-medium hover:bg-secondary hover:text-white text-md rounded-md text-gray-700"
        >
          Αρχική
        </Link>
        <div className="relative group">
          <button
            className="flex px-4 py-2 hover:bg-secondary font-medium items-center gap-2 hover:text-white text-md rounded-md text-gray-700"
          >
            Οπτικοποιήσεις <FaAngleDown />
          </button>
          <ul className="absolute left-0 w-80 bg-white border rounded-md shadow-lg z-10 hidden group-hover:block">
            <li>
              <Link
                to="/active-students-chart"
                className="block px-4 py-2 hover:bg-secondary hover:text-white text-sm rounded-md text-gray-700"
              >
                {t("homepage.visualizations.active_students.title")}
              </Link>
            </li>
            <li>
              <Link
                to="/inactive_students"
                className="block px-4 py-2 hover:bg-secondary hover:text-white text-sm rounded-md text-gray-700"
              >
                {t("homepage.visualizations.inactive_students.title")}
              </Link>
            </li>
            <li>
              <Link
                to="/students_graduation"
                className="block px-4 py-2 hover:bg-secondary hover:text-white text-sm rounded-md text-gray-700"
              >
                {t("homepage.visualizations.graduateProgressChart.title")}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <LanguageSelector />
    </header>
  );
};

export default Header;
