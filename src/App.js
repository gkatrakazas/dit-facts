import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import HomePage from "./HomePage";
import PassingCourses from "./charts/passingCourses/PassingCourses";
import InactiveStudents from "./charts/inactiveStudents/InactiveStudents";
import GraduatesDuration from "./charts/graduatesDuration/GraduatesDuration";
import GraduationTimelines from "./charts/graduationTimelines/graduationTimelines";
import { I18nextProvider } from 'react-i18next';
import i18n from "./i18n";

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Layout>
          <Routes>
            <Route path="dit-stats/" element={<HomePage />} />
            <Route path="dit-stats/inactive-students" element={<InactiveStudents />} />
            <Route path="dit-stats/graduation-timelines" element={<GraduationTimelines />} />
            <Route path="dit-stats/graduates-duration" element={<GraduatesDuration />} />
            <Route path="dit-stats/passing-courses" element={<PassingCourses />} />

          </Routes>
        </Layout>
      </Router>
    </I18nextProvider>
  );
};

export default App;
