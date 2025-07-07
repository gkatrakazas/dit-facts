import React from "react";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 w-full">
      <Header />
      <div className="flex-1 mb-10">{children}</div>
    </div>
  );
};

export default Layout;
