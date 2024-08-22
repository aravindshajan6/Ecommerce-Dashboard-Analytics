import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);
import SalesAnalytics from "../Sales/SalesAnalytics";

const backend_url = import.meta.env.VITE_BACKEND_URL;

const Overview = () => {
  const [totalSalesAmount, setTotalSalesAmount] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsData, setTopProductsData] = useState(false); //loading for top products table

  useEffect(() => {
    // Fetch total sales amount
    console.log("backedn url ################ : ", backend_url);
    const fetchTotalSalesAmount = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/sales/getTotalSalesAmount`
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

    // Fetch total no of products
    const fetchTotalProducts = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/products/getTotalProducts`
        );
        if (response.data.success === true) {
          setTotalProducts(response.data.totalProducts);
          console.log("total products", response.data.totalProducts);
        }
      } catch (error) {
        console.log("Error fetching total products amount:", error);
      }
    };
    fetchTotalProducts();

    // Fetch total no of orders
    const fetchTotalOrders = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/orders/getTotalOrderCount`
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

    // Fetch total no of customers
    const fetchTotalCustomers = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/customers/getCustomerCount`

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

    // Fetch Top10 Products
    const fetchTop10Products = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/products/getTop10Products`

        );
        if (response.data.success === true) {
          setTopProducts(response.data.topProducts);
          console.log("top products", response.data.topProducts);
          setTopProductsData(true);
        }
      } catch (error) {
        console.log("Error fetching total customer count:", error);
      }
    };
    fetchTop10Products();
  }, []);

  return (
    <section id="overview" className="py-4 bg-[#213349] ">
      {/* Dashboard overview container */}
      <div className="container mx-auto px-6 bg-[#213349]  max-h-[205px] ">
        <h2 className="text-3xl font-semibold text-white mb-6">
          Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <div className="rounded-lg shadow p-6  bg-white max-w-[250px]">
            <h3 className="text-xl font-semibold  text-gray-800">
              Total Sales
            </h3>
            <p className="mt-2 text-gray-600">{totalSalesAmount} INR</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white max-w-[250px]">
            <h3 className="text-xl font-semibold text-gray-800">
              Total Orders
            </h3>
            <p className="mt-2 text-gray-600">{totalOrders}</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white max-w-[250px]">
            <h3 className="text-xl font-semibold text-gray-800">Customers</h3>
            <p className="mt-2 text-gray-600">{totalCustomers}</p>
          </div>
          <div className="rounded-lg shadow p-6 bg-white max-w-[250px]">
            <h3 className="text-xl font-semibold text-gray-800">Inventory</h3>
            <p className="mt-2 text-gray-600">{totalProducts} Items</p>
          </div>
        </div>
      </div>
      <div className="bottom-container flex w-full h-full bg-[#213349] mt-[42px]">
        {/* left sub container  */}
        <div className="w-full md:w-2/3 bg-[#213349] rounded-lg shadow p-4 mb-6 mr-5 mt-[-70px]">
          <SalesAnalytics />
        </div>
        {/* right sub container for top products table */}
        <div
          id="top10"
          className="  w-full md:w-1/3  bg-gray-400 rounded-lg shadow mr-4"
          style={{ maxHeight: "570px", overflow: "hidden" }}
        >
          <h3 className="text-xl font-semibold text-white mb-4 text-center items-center justify-center flex mt-2">
            Top Products Sold
          </h3>
          <div className="overflow-x-auto ">
            <div
              className="overflow-y-auto scroll-smooth"
              style={{ maxHeight: "450px" }}
            >
              <table className="min-w-full  border-separate border-spacing-0 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Product Name
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Total Sold
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-center">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 10).map((product) => (
                    <tr key={product._id}>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {product.productName}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center  text-sm">
                        {product.totalSold}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center  text-sm">
                        ${product.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Overview;
