import React, { useEffect, useState } from "react";
import axios from "axios";
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

const backend_url = import.meta.env.VITE_BACKEND_URL;

const CustomerCohorts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCLVData = async () => {
      try {
        const response = await axios.get(
          `${backend_url}/api/customers/clvByCohorts`
        );
        if (response.data.success) {
          setData(response.data.clvByCohorts);
          console.log(response.data.clvByCohorts);
        } else {
          console.error("Failed to fetch CLV data");
        }
      } catch (error) {
        console.error("Error fetching CLV data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCLVData();
  }, []);

  // Prepare data for the chart
  const chartData = {
    labels: data.map((item) => item._id), // Cohort months
    datasets: [
      {
        label: "Total CLV",
        data: data.map((item) => item.totalCLV),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, o.5)",
        fill: true,
      },
      {
        label: "Number of Customers",
        data: data.map((item) => item.numberOfCustomers),
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        // fill: true,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat().format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <section id="customers" className="py-8 px-6 bg-gray-100 rounded-lg">
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Customer Lifetime value by Cohorts
          </h3>
        </div>
        <Line data={chartData} options={options} />
      </div>
    </section>
  );
};

export default CustomerCohorts;
