import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";


const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Sample visualizations data
  const visualizations = [
    {
      title: t("visualization.inactiveStudents.title"),
      route: "/inactive-students",
      img: `${process.env.PUBLIC_URL}/inactive_students.png`
    },
    {
      title: t("visualization.passingCourses.title"),
      route: "/passing-courses",
      img: `${process.env.PUBLIC_URL}/passing-courses.png`
    },
    {
      title: t("visualization.graduatesDuration.title"),
      route: "/graduates-duration",
      img: `${process.env.PUBLIC_URL}/graduates-duration.png`
    },
    {
      title: t("visualization.graduationTimelines.title"),
      route: "/graduation-timelines",
      img:`${process.env.PUBLIC_URL}/graduation-timelines.png`
    },
  ];

  return (
    <div className="bg-gray-100">
      <div className="p-6 flex flex-col items-center">
        <p className="text-lg text-gray-600 mb-8 text-center">
          {t("homepage.welcome")}
        </p>
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl">
          {visualizations.map((viz) => (
            <div
              key={viz.title}
              role="button"
              tabIndex={0}
              className="group bg-white text-center shadow-md rounded-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 p-6 flex flex-col justify-between w-full sm:w-[48%] lg:w-[23%] border-t-4 border-primary hover:border-secondary"
              onClick={() => navigate(viz.route)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate(viz.route);
              }}
            >
              <div>
                <h2 className="text-xl flex flex-col gap-2 font-semibold text-primary group-hover:text-secondary group-hover:opacity-80 transition duration-200 mb-2">
                  <img className="h-40 w-auto object-cover" src={viz.img} alt="vis img"></img>
                  {viz.title.replace(/\//g, "\u2060/\u2060")}

                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;