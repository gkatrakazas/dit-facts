import React from "react";
import Header from "./Header";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 w-full">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default Layout;
