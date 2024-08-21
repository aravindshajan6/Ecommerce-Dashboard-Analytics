import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Overview from '../Overview/Overview'
import YearlySalesGrowth from "./YearlySalesGrowth";
import SalesAnalytics from "./SalesAnalytics";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Sales = () => {
  
  return (
    <div className="min-h-screen bg-gray-100 ">
      <main>
        <Overview className="w-full" />
        <div className="container flex flex-col justify-center items-center w-full bg-gray-100">
          <div className="sub-container w-[70%] h-[70%] bg-gray-100">
            <div className="flex-1 p-4 ">
              <SalesAnalytics />
            </div>
            <div className="flex-1 p-4 ">
              <YearlySalesGrowth />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sales ;

