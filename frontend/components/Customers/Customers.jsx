import React from "react";
import Overview from "../Overview/Overview";
import CustomersAdded from "./CustomersAdded";
import RepeatCustomers from "./RepeatCustomers";
import MapContainer from "./GeographicalDistribution";
import CustomerCohorts from "./CustomerCohorts";

const backend_url = import.meta.env.VITE_BACKEND_URL;


const Customers = () => {
  return (
    <div>
      <main>
        {/* <Overview className="w-full" /> */}
        <div className="container flex flex-col justify-center items-center w-full bg-[#213349]">
          <div className="sub-container w-[80%] h-[70%] bg-[#213349]">
            <div className="flex-1 p-4 ">
              {/* graph of new customers in intervals  */}
              <CustomersAdded />
            </div>
            <div className="flex-1 p-4 ">
              {/* graph of repeat customers in intervals  */}
              <RepeatCustomers />
            </div>
            <div className="flex-1 p-4 ">
              {/* graph showing customer cohorts */}
              <CustomerCohorts />
            </div>
            <div className="flex-1 p-4 ">
              {/* map showing customer count from cities  */}
              <MapContainer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Customers;
