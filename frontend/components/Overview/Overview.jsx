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
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    // Fetch total sales amount
    const fetchTotalSalesAmount = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3010/api/sales/getTotalSalesAmount"
        );
        if (response.data.success === true) {
          setTotalSalesAmount(response.data.totalSalesAmount);
          console.log("total sales amount", response.data.totalSalesAmount);
        }
      } catch (error) {
        console.log("Error fetching total sales amount:", error);
      }
    };
    fetchTotalSalesAmount();
                                                                                                           
    //Fetch total no of products          
    const fetchTotalProducts = async () => {                                                                                        
      try {
        const response = await axios.get(
          "http://localhost:3010/api/products/getTotalProducts"
        );
        if (response.data.success === true) {
          setTotalProducts(response.data.totalProducts);
          console.log("total products",response.data.totalProducts);
        }
      } catch (error) {
        console.log("Error fetching total products amount:", error);
      }
    };
    fetchTotalProducts();  

    //Fetch total no of orders          
    const fetchTotalOrders = async () => {                                                                                        
      try {
        const response = await axios.get(
          "http://localhost:3010/api/orders/getTotalOrderCount"
        );
        if (response.data.success === true) {
          setTotalOrders(response.data.totalOrders);
          console.log("total orders", response.data.totalOrders);
        }
      } catch (error) {
        console.log("Error fetching total orders amount:", error);
      }
    };
    fetchTotalOrders(); 

    //Fetch total no of customers          
    const fetchTotalCustomers= async () => {                                                                                        
      try {
        const response = await axios.get(
          "http://localhost:3010/api/customers/getCustomerCount"
        );
        if (response.data.success === true) {
          setTotalCustomers(response.data.customerCount);
          console.log("total orders", response.data.customerCount);
        }
      } catch (error) {
        console.log("Error fetching total customer count:", error);
      }
    };
    fetchTotalCustomers();  

  }, []);

  // Return the JSX for rendering
  return (
    <section id="overview" className="py-8 bg-[#213349]" >
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">Total Sales</h3>
            <p className="mt-2 text-gray-600">${totalSalesAmount}</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">Total Orders</h3>
            <p className="mt-2 text-gray-600"> {totalOrders} </p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">
               Customers
            </h3>
            <p className="mt-2 text-gray-600">{totalCustomers}</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white">
            <h3 className="text-xl font-semibold text-gray-800">Inventory</h3>
            <p className="mt-2 text-gray-600">{totalProducts} Items</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Overview;
