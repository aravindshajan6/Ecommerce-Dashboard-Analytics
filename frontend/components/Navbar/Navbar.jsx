// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          Shopify App 
        </div>
        <ul className="flex space-x-4">
          <li>
            <Link to="/" className="text-gray-300 hover:text-white">
              Home
            </Link>
          </li>
          {/* <li>
            <Link to="/overview" className="text-gray-300 hover:text-white">
              Overview
            </Link>
          </li> */}
          <li>
            <Link to="" className="text-gray-300 hover:text-white">
              Pricing
            </Link>
          </li>
          <li>
            <Link to="" className="text-gray-300 hover:text-white">
              About Us
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
