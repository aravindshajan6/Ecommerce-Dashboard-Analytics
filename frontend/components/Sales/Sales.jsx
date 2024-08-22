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
    <div className="min-h-screen bg-[#213349]">
      <main>
        <Overview className="w-full" />
        <div className="container flex flex-col justify-center items-center w-full bg-[#213349]">
          <div className="sub-container w-[80%] h-[70%] bg-[#213349]">
            <div className="flex-1 p-4 items-center justify-center">
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

