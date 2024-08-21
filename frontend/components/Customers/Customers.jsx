import React from "react";
import Overview from "../Overview/Overview";
import CustomersAdded from "./CustomersAdded";
import RepeatCustomers from "./RepeatCustomers";
import MapContainer from "./GeographicalDistribution";
import CustomerCohorts from "./CustomerCohorts";

const Customers = () => {
  return (
    <div>
      <main>
        <Overview className="w-full" />
        <div className="container flex flex-col justify-center items-center w-full bg-gray-100">
          <div className="sub-container w-[70%] h-[70%] bg-gray-100">
            <div className="flex-1 p-4 ">
              {/* graph of new customers in intervals  */}
              <CustomersAdded />
            </div>
            <div className="flex-1 p-4 ">
              {/* graph of repeat customers in intervals  */}
              <RepeatCustomers />
            </div>
            <div className="flex-1 p-4 ">
              {/* graph showing customer cohorts from cities */}
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
