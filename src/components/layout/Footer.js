import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-800 text-white p-4 mt-auto shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm">
        <p className="mb-2 sm:mb-0">
          © {currentYear} DIT Facts - All rights reserved.
        </p>
        <p>
          Made by <a href="https://github.com/gkatrakazas" target="_blank" rel="noopener noreferrer">gkatrakazas</a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;