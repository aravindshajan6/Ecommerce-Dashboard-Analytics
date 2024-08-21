import axios from "axios";
import React, { useEffect, useState } from "react"; // Capitalize 'React'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement, // Import PointElement
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement, // Register PointElement
  Title,
  Tooltip,
  Legend
);


// Overview Component
const Overview = () => {
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);

  useEffect(() => {
    // Fetch total sales amount
    const fetchTotalSalesAmount = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3010/api/sales/getTotalSalesAmount"
        );
        if (response.data.success === true) {
          setTotalSalesAmount(response.data.totalSalesAmount);
          console.log(response.data.totalSalesAmount);
        }
      } catch (error) {
        console.log("Error fetching total sales amount:", error);
      }
    };

    fetchTotalSalesAmount();
  }, []);

  // Return the JSX for rendering
  return (
    <section id="overview" className="py-8">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">Total Sales</h3>
            <p className="mt-2 text-gray-600">${totalSalesAmount}</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">New Orders</h3>
            <p className="mt-2 text-gray-600">150</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">
              New Customers
            </h3>
            <p className="mt-2 text-gray-600">30</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">Inventory</h3>
            <p className="mt-2 text-gray-600">500 Items</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Overview;
