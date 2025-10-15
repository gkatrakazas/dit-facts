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
            <Route path="/" element={<HomePage />} />
            <Route path="/inactive-students" element={<InactiveStudents />} />
            <Route path="/graduation-timelines" element={<GraduationTimelines />} />
            <Route path="/graduates-duration" element={<GraduatesDuration />} />
            <Route path="/passing-courses" element={<PassingCourses />} />

          </Routes>
        </Layout>
      </Router>
    </I18nextProvider>
  );
};

export default App;
