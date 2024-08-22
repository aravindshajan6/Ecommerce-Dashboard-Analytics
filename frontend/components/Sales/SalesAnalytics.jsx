import axios from "axios";
import  { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";


const SalesAnalytics = () => {
  const [data, setData] = useState([]); 
  const [interval, setInterval] = useState("monthly"); 

  useEffect(() => {
    //fetch sales data based on selected interval
    const fetchSalesData = async () => {
      try {
        const response = await axios.get(
          //   `http://localhost:3010/api/sales/${interval}Sales`
          `http://localhost:3010/api/sales/getSalesData?interval=${interval}`
        );
        if (response.data.success === true) {
          setData(response.data[`${interval}Sales`]);
        } else {
        }
      } catch (error) {
        console.log("error fetching data:", error.message);
      } finally {
      }
    };

    fetchSalesData();
  }, [interval]);

  // Handle interval change
  const handleIntervalChange = (event) => {
    setInterval(event.target.value);
    console.log("interval changed , : ", event.target.value);
    setLoading(true); 
  };

  // Total Sales Chart
  const TotalSalesChart = () => {
    const chartData = {
      labels: data.map((item) => item._id), 
      datasets: [
        {
          label: `${interval} Sales`,
          data: data.map((item) => item.totalSales),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
      ],
    };

    return <Line data={chartData} />; 
  };

  return (
    <section id="sales" className="py-8 bg-[#213349] max-w-[900px] ">
      <div className="container mx-auto px-6 ">
        <h2 className="text-3xl font-semibold text-white  mb-6">
          Sales Analytics
        </h2>
        <div className="bg-white rounded-lg shadow p-6 ">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Sales Over Time
          </h3>
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
              <option value="daily">Daily Sales</option>
              <option value="monthly">Monthly Sales</option>
              <option value="quarterly">Quarterly Sales</option>
              <option value="yearly">Yearly Sales</option>
            </select>
          </div>
          <TotalSalesChart />
        </div>
      </div>
    </section>
  );
};

export default SalesAnalytics;
