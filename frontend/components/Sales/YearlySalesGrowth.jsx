import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";

const YearlySalesGrowth = () => {
  const [yearlySalesGrowthData, setYearlySalesGrowthData] = useState([]);

  useEffect(() => {
    const fetchYearlySalesGrowthData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3010/api/sales/yearlyGrowthRate"
        );
        if (response.data.success === true) {
          setYearlySalesGrowthData(response.data.yearlySalesGrowthRate);
          // console.log("fetchYearlySalesGrowthData : ", response.data);
        }
      } catch (error) {
        console.log("Error fetching data:", error);
      }
    };

    fetchYearlySalesGrowthData();
  }, []);

  // Prepare data for chart
  const years = yearlySalesGrowthData.map((item) => item.year);
  // console.log("Years**************:", years); // Debugging

  const growthRates = yearlySalesGrowthData.map((item) => {
    if (item.growthRate === null || item.growthRate === undefined) {
      return 0; // Default value for missing growth rate
    }
    // Parse the growth rate and handle percentage
    const rate = parseFloat(item.growthRate.replace("%", ""));
    return isNaN(rate) ? 0 : rate;
  });

  // console.log("Growth Rates:", growthRates); // Debugging

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "Sales Growth Rate (%)",
        data: growthRates,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  return (
    <section id="sales-growth" className="py-8 bg-gray-100 rounded-lg max-w-[900px]  ">
      <div className="container mx-auto px-6 ">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Yearly Sales Growth
        </h2>
        <div className="bg-white rounded-lg shadow p-6 max-w-[880px]">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Sales Growth Over Time 
          </h3>
          <Line data={chartData} />
        </div>
      </div>
    </section>
  );
};

export default YearlySalesGrowth;
