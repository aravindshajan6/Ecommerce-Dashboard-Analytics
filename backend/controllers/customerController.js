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

//new customers per month
export const monthlyNewCustomers = async (req, res) => {
  console.log("inside monthlyNewCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;

    const newCustomers = await db
      .collection("shopifyCustomers")
      .aggregate([
        {
          $addFields: {
            created_at_date: {
              $dateFromString: { dateString: "$created_at" },
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$created_at_date" },
            },
            newCustomers: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by month
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Monthly new customers data fetched from DB",
      monthlyNewCustomers: newCustomers,
    });
  } catch (error) {
    console.error("Error in monthlyNewCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//new customers per day
export const dailyNewCustomers = async (req, res) => {
  console.log("inside dailyNewCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;

    const newCustomers = await db
      .collection("shopifyCustomers")
      .aggregate([
        {
          $addFields: {
            created_at_date: {
              $dateFromString: { dateString: "$created_at" },
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_at_date" },
            },
            newCustomers: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by month
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Daily new customers data fetched from DB",
      dailyNewCustomers: newCustomers,
    });
  } catch (error) {
    console.error("Error in monthlyNewCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//new customers per year
export const yearlyNewCustomers = async (req, res) => {
  console.log("inside yearlyNewCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;

    const newCustomers = await db
      .collection("shopifyCustomers")
      .aggregate([
        {
          $addFields: {
            created_at_date: {
              $dateFromString: { dateString: "$created_at" },
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y", date: "$created_at_date" } },
            newCustomers: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by month
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Yearly new customers data fetched from DB",
      yearlyNewCustomers: newCustomers,
    });
  } catch (error) {
    console.error("Error in yearlyNewCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//customer geographical distribution
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
            from: "shopifyOrders", // Use the same collection
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
