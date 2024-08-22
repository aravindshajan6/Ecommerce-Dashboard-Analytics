import axios from "axios";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from "chart.js";
  
  // Register chart components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    LineElement,
    Title,
    Tooltip,
    Legend
  );


const CustomersAdded = () => {
  const [data, setData] = useState([]); //for data from sales

  const [interval, setInterval] = useState("monthly"); //  interval for sales data
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("fetch customer data useEffect running");
    //fetch fetch customer data based on selected interval
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(
          //   `http://localhost:3010/api/sales/${interval}Sales`
          `http://localhost:3010/api/customers/newCustomersAdded?interval=${interval}`
        );
        if (response.data.success === true) {
          setData(response.data.newCustomers);
          console.log(
            "new customer data based on interval : ",
            response.data.newCustomers
          );
        } else {
          console.log("Failed to fetch data");
        }
      } catch (error) {
        console.log("error fetching data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomerData();
  }, [interval]);

  // Handle interval change
  const handleIntervalChange = (event) => {
    setInterval(event.target.value);
    console.log("interval changed , : ", event.target.value);
    setLoading(true); // Set loading true to show loading indicator during fetch
  };

  // New Customers Chart
  const NewCustomers = () => {
    const chartData = {
      labels: data.map((item) => item._id), // Assuming _id is the date string
      datasets: [
        {
          label: `New ${interval} Customers`,
          data: data.map((item) => item.count),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
      ],
    };

    return <Line data={chartData} />;
  };

  // Customer Analytics Component
  const CustomerAnalytics = () => (
    <section id="sales" className="py-8 bg-gray-100 rounded-lg">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Customer Analytics
        </h2>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            New customers over time
          </h3>
          {/* Select component */}
          <div className="mb-4">
            <label
              htmlFor="interval"
              className="block text-gray-700 text-sm font-medium mb-2"
            >
              Select Interval:
            </label>
            <select
              id="interval"
              value={interval}
              onChange={handleIntervalChange}
              className="block w-full p-2 border border-gray-300 rounded"
            >
              <option value="daily">Daily </option>
              <option value="monthly">Monthly </option>
              <option value="quarterly">Quarterly </option>
              <option value="yearly">Yearly </option>
            </select>
          </div>
        </div>
        <NewCustomers />
      </div>
    </section>
  );

  return (
    <div>
      <CustomerAnalytics />
    </div>
  );
};

export default CustomersAdded;
