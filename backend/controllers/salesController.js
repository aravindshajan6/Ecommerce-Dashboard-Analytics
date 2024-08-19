import { conn } from "../DB/dbConnection.js";

// daily-sales
export const dailySales = async (req, res) => {
  console.log("inside get dailySales Fn");

  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;

    const sales = await db
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
              $dateToString: { format: "%Y-%m-%d", date: "$created_at_date" },
            },
            totalSales: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by date
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Daily sales data fetched from DB",
      dailySales: sales,
    });
  } catch (error) {
    console.error("Error in dailySales:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//monthly-sales
export const monthlySales = async (req, res) => {
  console.log("inside get monthlySales Fn");

  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;

    const sales = await db
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
              $dateToString: { format: "%Y-%m", date: "$created_at_date" },
            },
            totalSales: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by year and month
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Monthly sales data fetched from DB",
      monthlySales: sales,
    });
  } catch (error) {
    console.error("Error in monthlySales:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//quarterly-sales
export const quarterlySales = async (req, res) => {
  console.log("inside get quarterlySales Fn");

  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;

    const sales = await db
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
              year: { $year: "$created_at_date" },
              quarter: {
                $ceil: { $divide: [{ $month: "$created_at_date" }, 3] },
              },
            },
            totalSales: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.quarter": 1 }, // Sort by year and quarter
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Quarterly sales data fetched from DB",
      quarterlySales: sales,
    });
  } catch (error) {
    console.error("Error in quarterlySales:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//yearly sales
export const yearlySales = async (req, res) => {
  console.log("inside get yearlySales Fn");

  try {
    if (!conn) {
      return res.status(500).json({
        success: false,
        message: "Database connection not established!",
      });
    }

    const db = conn.connection.db;

    const sales = await db
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
            _id: { $year: "$created_at_date" },
            totalSales: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by year
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      message: "Yearly sales data fetched from DB",
      yearlySales: sales,
    });
  } catch (error) {
    console.error("Error in yearlySales:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

//yearly sales growth rate
export const yearlySalesGrowthRate = async (req, res) => {
  console.log("inside yearlySalesGrowthRate Fn");
  try {
    if (!conn) {
      console.log("Db connection not established");
    }
    const db = conn.connection.db;

    const sales = await db
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
            _id: { $year: "$created_at_date" },
            totalSales: {
              $sum: { $toDouble: "$total_price_set.shop_money.amount" },
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by year
        },
      ])
      .toArray();

    // Calculate growth rate
    const growthRates = sales.map((current, index) => {
      if (index === 0) {
        return {
          year: current._id,
          totalSales: current.totalSales,
          growthRate: null,
        }; // No growth rate for the first year
      }
      const previous = sales[index - 1];
      const growthRate =
        ((current.totalSales - previous.totalSales) / previous.totalSales) *
        100;
      return {
        year: current._id,
        totalSales: current.totalSales,
        growthRate: growthRate.toFixed(2) + " %",
      };
    });

    res.status(200).json({
      success: true,
      message: "Yearly sales growth rate data fetched from DB",
      yearlySalesGrowthRate: growthRates,
    });
  } catch (error) {
    console.log("error in yearlySalesGrowthRate Fn");
    res.status(500).json({ success: false, message: error.message });
  }
};
