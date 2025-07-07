import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Sample visualizations data
  const visualizations = [
    {
      title: t("homepage.visualizations.active_students.title"),
      description: t("homepage.visualizations.active_students.description"),
      route: "/active-students-chart",
      img: "./active-students.png"
    },
    {
      title: t("homepage.visualizations.inactive_students.title"),
      description: t("homepage.visualizations.inactive_students.description"),
      route: "/inactive_students",
      img: "./inactive_students.png"
    }
  ];

  return (
    <div className="bg-gray-100">
      <div className="p-6 flex flex-col items-center">
        <p className="text-lg text-gray-600 mb-8 text-center">
          {t("homepage.welcome")}
        </p>
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
          {visualizations.map((viz) => (
            <div
              key={viz.title}
              role="button"
              tabIndex={0}
              className="group bg-white text-center shadow-md rounded-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 p-6 flex flex-col justify-between w-full sm:w-[48%] lg:w-[30%] border-t-4 border-primary hover:border-secondary"
              onClick={() => navigate(viz.route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(viz.route);
              }}
            >
              <div>
                <h2 className="text-xl flex flex-col gap-2 font-semibold text-primary group-hover:text-secondary group-hover:opacity-80 transition duration-200 mb-2">
                  <img className="h-40 w-auto object-cover" src={viz.img}></img>
                  {viz.title}
                  </h2>
                {/* <p className="text-gray-600 mb-4">
                  {viz.description}
                  </p> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;