import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import HomePage from "./HomePage";
import EchelD3Visualization from "./EchelD3Visualization";
import ActiveStudents from "./charts/activeStudents/ActiveStudents";
import InactiveStudents from "./charts/inactiveStudents/InactiveStudents";
import StudentsGraduation from "./charts/studentsGraduation/studentsGraduation";
import { I18nextProvider } from 'react-i18next';
import i18n from "./i18n";

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/echel-performance" element={<EchelD3Visualization />} />
            <Route path="/active-students-chart" element={<ActiveStudents />} />
            <Route path="/inactive_students" element={<InactiveStudents />} />
            <Route path="/students_graduation" element={<StudentsGraduation />} />
          </Routes>
        </Layout>
      </Router>
    </I18nextProvider>
  );
};

export default App;
