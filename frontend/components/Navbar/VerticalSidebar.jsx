import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-600 h-screen w-64 fixed top-0 left-0 p-4 flex flex-col">
      <div className="text-white text-2xl font-bold mb-10">Dashboard</div>
      <ul className="flex flex-col space-y-4">
        <li>
          <Link to="/overview" className="text-gray-300 hover:text-white">
            Overview
          </Link>
        </li>
        <li>
          <Link to="/sales" className="text-gray-300 hover:text-white">
            Sales
          </Link>
        </li>
        <li>
          <Link to="/customers" className="text-gray-300 hover:text-white">
            Customers
          </Link>
        </li>
        <li>
          <h2 to="" className="text-gray-300 hover:text-white">
            Orders
          </h2>
        </li>
        <li>
          <h2 to="" className="text-gray-300 hover:text-white">
            Products
          </h2>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
