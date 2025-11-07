# DIT Facts Visualization Dashboard

This project is a responsive, multi-language (English and Greek) React application designed to visualize student data from the Department of Informatics and Telecommunications (DIT). It utilizes React Router for navigation, D3.js for dynamic data visualization, and Tailwind CSS for a mobile-first, responsive design.

## Features

*   **Multi-Language Support:** Implemented using `react-i18next` for seamless translation between English (`en`) and Greek (`el`).
*   **Data Visualization:** Includes interactive D3.js charts (Bubble Packs, Stacked Bar Charts, Line Charts) for various data analysis, such as:
    *   Inactive Students (Bubble Pack with Inactivity Duration).
    *   Passing Courses Distribution (Stacked Bar Chart and Treemap).
    *   Graduates Duration (Bubble Pack with Time-to-Degree).
    *   Graduation Timelines (Line Charts for average time and average grade over enrollment years).
*   **Interactive Filters:** Visualizations include filters for admission year, course load, admission type, and status, with dynamic filtering modes (`hide` or `dim`).
*   **Data Table:** Provides access to the raw underlying data with pagination controls.