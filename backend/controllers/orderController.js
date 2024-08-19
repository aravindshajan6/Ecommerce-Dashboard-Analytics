import { conn } from "../DB/dbConnection.js";

export const getAllOrders = async (req, res) => {
  console.log("inside get all order FN");
  try {
    if (!conn) {
      console.log("no connection with MongoDB");
    }

    const db = conn.connection.db; // Access the database object
    const collection = db.collection("shopifyOrders"); // Use your collection name

    // Log collection name and database name
    console.log("Collection Name: ", collection.collectionName);
    console.log("Database Name: ", db.databaseName);

    const orders = await collection.find({}).toArray();
    res.status(200).json({
      success: true,
      message: "order info fetched from DB",
      orders: orders,
    });
  } catch (error) {
    console.log("error in getAllOrders Fn: ", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

//daily repeat customers
export const dailyRepeatCustomers = async (req, res) => {
  console.log("inside dailyRepeatCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;
    const dailyRepeatCustomers = await db
      .collection("shopifyOrders")
      .aggregate([
        {
          $group: {
            _id: {
              customerId: "$customerId",
              day: { $dayOfYear: "$orderDate" },
              year: { $year: "$orderDate" },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $match: { orderCount: { $gt: 1 } },
        },
        {
          $group: {
            _id: "$_id.customerId",
            repeatDays: { $sum: 1 },
          },
        },
        {
          $match: { repeatDays: { $gt: 0 } },
        },
      ]);

    res.status(200).json({
      success: true,
      message: "daily Repeat Customers data fetched from DB",
      dailyRepeatCustomers: dailyRepeatCustomers,
    });
  } catch (error) {
    console.error("Error in dailyRepeatCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//monthly repeat customers
export const monthlyRepeatCustomers = async (req, res) => {
  console.log("inside monthlyRepeatCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;

    const monthlyRepeatCustomers = await db
      .collection("shopifyOrders")
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
              customer_id: "$customer.id",
              yearMonth: {
                $dateToString: { format: "%Y-%m", date: "$created_at_date" },
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $match: {
            orderCount: { $gt: 1 }, // Filter for customers with more than one order in a month
          },
        },
        {
          $group: {
            _id: "$_id.customer_id",
            repeatMonths: { $push: "$_id.yearMonth" },
            totalRepeatCount: { $sum: "$orderCount" },
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "monthly Repeat Customers data fetched from DB",
      monthlyRepeatCustomers: monthlyRepeatCustomers,
    });
  } catch (error) {
    console.error("Error in monthlyRepeatCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//yearly repeat customers
export const yearlyRepeatCustomers = async (req, res) => {
  console.log("inside yearlyRepeatCustomers Fn");
  try {
    if (!conn) {
      console.log("no DB connection!");
    }
    const db = conn.connection.db;

    const yearlyRepeatCustomers = await db
      .collection("shopifyOrders")
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
              customer_id: "$customer.id",
              year: { $year: "$created_at_date" },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $match: {
            orderCount: { $gt: 1 }, // Filter for customers with more than one order in the year
          },
        },
        {
          $group: {
            _id: "$_id.customer_id",
            repeatYears: { $push: "$_id.year" },
            totalRepeatCount: { $sum: "$orderCount" },
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "yearly Repeat Customers data fetched from DB",
      yearlyRepeatCustomers: yearlyRepeatCustomers,
    });
  } catch (error) {
    console.error("Error in yearlyRepeatCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//quarterly repeat customers
export const quarterlyRepeatCustomers = async (req, res) => {
  console.log("inside quarterlyRepeatCustomers Fn");

  try {
    if (!conn) {
      console.log("no DB connection!");
    }

    const db = conn.connection.db;

    const quarterlyRepeatCustomers = await db
      .collection("shopifyOrders")
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
              customer_id: "$customer.id",
              year: { $year: "$created_at_date" },
              quarter: {
                $ceil: { $divide: [{ $month: "$created_at_date" }, 3] },
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        {
          $match: {
            orderCount: { $gt: 1 }, // Filter for customers with more than one order in the quarter
          },
        },
        {
          $group: {
            _id: "$_id.customer_id",
            repeatQuarters: {
              $push: { year: "$_id.year", quarter: "$_id.quarter" },
            },
            totalRepeatCount: { $sum: "$orderCount" },
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Quarterly repeat customers data fetched from DB",
      quarterlyRepeatCustomers: quarterlyRepeatCustomers,
    });
  } catch (error) {
    console.error("Error in quarterlyRepeatCustomers:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
