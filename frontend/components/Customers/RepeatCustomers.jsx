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

const RepeatCustomers = () => {
  const [data, setData] = useState([]); //for data from sales

  const [interval, setInterval] = useState("monthly"); //  interval for sales data

  useEffect(() => {
    console.log("fetch repeat customer data useEffect running");
    //fetch fetch customer data based on selected interval
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(
          //   `http://localhost:3010/api/sales/${interval}Sales`
          `http://localhost:3010/api/customers/getRepeatCustomers?interval=${interval}`
        );
        if (response.data.success === true) {
          setData(response.data.repeatCustomers);
          console.log(
            "repeat customer data based on interval : ",
            response.data.repeatCustomers
          );
        } else {
          console.log("Failed to fetch data");
        }
      } catch (error) {
        console.log("error fetching data:", error.message);
      } finally {
      }
    };
    fetchCustomerData();
  }, [interval]);

  // Handle interval change
  const handleIntervalChange = (event) => {
    setInterval(event.target.value);
    console.log("interval changed , : ", event.target.value);
  };

  // New Customers Chart
  const RepeatCustomersChart = () => {
    

    const chartData = {
        labels: data.map((item) => {
          if (interval === 'quarterly') {
            return `Q${item._id.quarter} ${item._id.year}`;
          } else {
            return item._id; // Adjust as needed for other intervals
          }
        }),
        datasets: [
          {
            label: `Repeat ${interval} Customers`,
            data: data.map((item) => item.repeatCustomerCount),
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
          },
        ],
      };

    return <Line data={chartData} />;
  };

  // Repeat Customers Component
  const RepeatCustomers = () => (
    <section id="customers" className="py-8 bg-gray-100">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">
          Customer Analytics
        </h2>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Repeat Customers over time
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
        <RepeatCustomersChart />
      </div>
    </section>
  );

  return (
    <div>
      <RepeatCustomers />
    </div>
  );
};

export default RepeatCustomers;
