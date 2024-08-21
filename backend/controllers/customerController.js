import { conn, dbConnection } from "../DB/dbConnection.js";

export const getAllCustomers = async (req, res) => {
  console.log("inside getAllCustomers route");
  try {
    if (!conn) {
      throw new Error("Database connection not established");
    }

    const db = conn.connection.db; // Access the database object
    const collection = db.collection("shopifyCustomers"); // Use your collection name

    // Log collection name and database name
    console.log("Collection Name: ", collection.collectionName);
    console.log("Database Name: ", db.databaseName);

    const customers = await collection.find({}).toArray();
    // console.log("customers : ", customers);
    res.status(200).json({
      success: true,
      message: "customers info fetched from DB",
      customers: customers,
    });
  } catch (error) {
    console.log("error in getAllCustomers : ", error.message);
  }
};

export const geographicalDistribution = async (req, res) => {
  console.log("inside geographicalDistribution Fn");
  try {
    if (!conn) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Database connection not established!",
        });
    }

    const db = conn.connection.db;
    const customers = await db
      .collection("shopifyCustomers")
      .aggregate([
        {
          $match: { "default_address.city": { $ne: null } }, // Filter out documents where city is null
        },
        {
          $group: {
            _id: "$default_address.city", // Group by city
            customerCount: { $sum: 1 }, // Count number of customers per city
          },
        },
        {
          $sort: { customerCount: -1 }, // Optional: Sort by number of customers, descending
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Geographical distribution of customers fetched from DB",
      geographicalData: customers,
    });
  } catch (error) {
    console.error("Error in geographicalDistribution:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//clv by cohorts
export const clvByCohorts = async (req, res) => {
  console.log("inside clvByCohorts Fn");
  try {
    if (!conn) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Database connection not established!",
        });
    }

    const db = conn.connection.db;

    // Step 1: Find the first purchase date for each customer
    const firstPurchaseDates = await db
      .collection("shopifyOrders")
      .aggregate([
        {
          $addFields: {
            created_at_date: { $dateFromString: { dateString: "$created_at" } },
          },
        },
        {
          $group: {
            _id: "$customer.id",
            firstPurchaseDate: { $min: "$created_at_date" },
          },
        },
      ])
      .toArray();

    // Create a map of customer ID to first purchase month
    const firstPurchaseMap = new Map();
    firstPurchaseDates.forEach((record) => {
      const month = new Date(record.firstPurchaseDate)
        .toISOString()
        .slice(0, 7); // Format YYYY-MM
      firstPurchaseMap.set(record._id, month);
    });

    // Step 2: Calculate CLV for each cohort
    const clvByCohorts = await db
      .collection("shopifyOrders")
      .aggregate([
        {
          $addFields: {
            created_at_date: { $dateFromString: { dateString: "$created_at" } },
          },
        },
        {
          $group: {
            _id: "$customer.id",
            totalRevenue: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $lookup: {
            from: "shopifyOrders",
            let: { customerId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$customer.id", "$$customerId"],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  firstPurchaseDate: {
                    $min: { $dateFromString: { dateString: "$created_at" } },
                  },
                },
              },
            ],
            as: "firstPurchaseData",
          },
        },
        {
          $unwind: "$firstPurchaseData",
        },
        {
          $addFields: {
            cohortMonth: {
              $dateToString: {
                format: "%Y-%m",
                date: "$firstPurchaseData.firstPurchaseDate",
              },
            },
          },
        },
        {
          $group: {
            _id: "$cohortMonth",
            totalCLV: { $sum: "$totalRevenue" },
            numberOfCustomers: { $count: {} }, // Count number of customers
          },
        },
        {
          $sort: { _id: 1 }, // Sort by cohort month
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Customer Lifetime Value by Cohorts fetched from DB",
      clvByCohorts,
    });
  } catch (error) {
    console.error("Error in clvByCohorts:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// New Customers Added Over Time
export const newCustomersAdded = async (req, res) => {
  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;
    const { interval } = req.query; // daily, monthly, quarterly, or yearly

    let groupBy;
    switch (interval) {
      case 'daily':
        groupBy = {
          $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$created_at" } }
        };
        break;
      case 'monthly':
        groupBy = {
          $dateToString: { format: "%Y-%m", date: { $toDate: "$created_at" } }
        };
        break;
      case 'quarterly':
        groupBy = {
          year: { $year: { $toDate: "$created_at" } },
          quarter: { $ceil: { $divide: [{ $month: { $toDate: "$created_at" } }, 3] } }
        };
        break;
      case 'yearly':
      default:
        groupBy = {
          $dateToString: { format: "%Y", date: { $toDate: "$created_at" } }
        };
        break;
    }

    const newCustomers = await db.collection("shopifyCustomers").aggregate([
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]).toArray();

    res.status(200).json({
      success: true,
      message: "New customers data fetched from DB",
      newCustomers,
    });
  } catch (error) {
    console.error("Error in newCustomersAdded:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//repeat customers over interval
// export const getRepeatCustomers = async (req, res) => {
//   console.log("inside getRepeatCustomers Fn")
//   try {
//     if (!conn) {
//       return res.status(500).json({
//         success: false,
//         message: "Database connection not established!",
//       });
//     }

//     const db = conn.connection.db;
//     const { interval } = req.query; // daily, monthly, quarterly, or yearly
//     console.log(interval)
//     let groupBy;
//     switch (interval) {
//       case 'daily':
//         groupBy = {
//           $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $concat: [ "$created_at", "Z" ] } } }
//         };
//         break;
//       case 'monthly':
//         groupBy = {
//           $dateToString: { format: "%Y-%m", date: { $toDate: { $concat: [ "$created_at", "Z" ] } } }
//         };
//         break;
//       case 'quarterly':
//         groupBy = {
//           year: { $year: { $toDate: { $concat: [ "$created_at", "Z" ] } } },
//           quarter: { $ceil: { $divide: [{ $month: { $toDate: { $concat: [ "$created_at", "Z" ] } } }, 3] } }
//         };
//         break;
//       case 'yearly':
//       default:
//         groupBy = {
//           $dateToString: { format: "%Y", date: { $toDate: { $concat: [ "$created_at", "Z" ] } } }
//         };
//         break;
//     }

//     const repeatCustomers = await db.collection("shopifyOrders").aggregate([
//       {
//         $group: {
//           _id: "$customer_id",
//           orderCount: { $sum: 1 },
//           firstOrderDate: { $min: "$created_at" },
//           lastOrderDate: { $max: "$created_at" }
//         }
//       },
//       {
//         $match: { orderCount: { $gt: 1 } }
//       },
//       {
//         $lookup: {
//           from: "shopifyCustomers",
//           localField: "_id",
//           foreignField: "id",
//           as: "customerDetails"
//         }
//       },
//       {
//         $unwind: "$customerDetails"
//       },
//       {
//         $project: {
//           _id: 0,
//           customerId: "$_id",
//           orderCount: 1,
//           firstOrderDate: 1,
//           lastOrderDate: 1,
//           customerName: { $concat: ["$customerDetails.first_name", " ", "$customerDetails.last_name"] },
//           customerEmail: "$customerDetails.email",
//           customerCity: "$customerDetails.default_address.city"
//         }
//       },
//       {
//         $group: {
//           _id: groupBy,
//           repeatCustomers: { $push: "$$ROOT" }
//         }
//       },
//       { $sort: { "_id": 1 } },
//     ]).toArray();

//     console.log("repeat customers data : ", repeatCustomers);

//     res.status(200).json({
//       success: true,
//       message: "Repeat customers data fetched from DB",
//       repeatCustomers,
//     });
//   } catch (error) {
//     console.error("Error in getRepeatCustomers:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getRepeatCustomers = async (req, res) => {
  console.log("inside getRepeatCustomers Fn");
  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;
    const { interval } = req.query; // daily, monthly, quarterly, or yearly
    console.log(interval);

    let groupBy;
    switch (interval) {
      case 'daily':
        groupBy = {
          $dateToString: { format: "%Y-%m-%d", date: "$created_at_date" }
        };
        break;
      case 'monthly':
        groupBy = {
          $dateToString: { format: "%Y-%m", date: "$created_at_date" }
        };
        break;
      case 'quarterly':
        groupBy = {
          year: { $year: "$created_at_date" },
          quarter: {
            $cond: [
              { $lte: [{ $month: "$created_at_date" }, 3] }, 1,
              { $cond: [
                { $lte: [{ $month: "$created_at_date" }, 6] }, 2,
                { $cond: [
                  { $lte: [{ $month: "$created_at_date" }, 9] }, 3, 4
                ]}
              ]}
            ]
          }
        };
        break;
      case 'yearly':
      default:
        groupBy = {
          $dateToString: { format: "%Y", date: "$created_at_date" }
        };
        break;
    }

    const repeatCustomers = await db.collection("shopifyOrders").aggregate([
      {
        $addFields: {
          created_at_date: { $dateFromString: { dateString: "$created_at" } }
        }
      },
      {
        $group: {
          _id: "$customer_id",
          orderCount: { $sum: 1 }
        }
      },
      {
        $match: { orderCount: { $gt: 1 } }
      },
      {
        $lookup: {
          from: "shopifyOrders",
          localField: "_id",
          foreignField: "customer_id",
          as: "orders"
        }
      },
      {
        $unwind: {
          path: "$orders",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $addFields: {
          created_at_date: { $dateFromString: { dateString: "$orders.created_at" } }
        }
      },
      {
        $group: {
          _id: groupBy,
          repeatCustomerCount: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();

    // console.log("repeat customer counts data : ", repeatCustomers);

    res.status(200).json({
      success: true,
      message: "Repeat customer counts data fetched from DB",
      repeatCustomers,
    });
  } catch (error) {
    console.error("Error in getRepeatCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};









