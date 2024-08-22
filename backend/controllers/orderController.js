import { conn } from "../DB/dbConnection.js";

//fn to get total no of order from DB
export const getTotalOrderCount = async (req, res) => {
  console.log("inside get all order FN");
  try {
    if (!conn) {
      console.log("no connection with MongoDB");
    }

    const db = conn.connection.db; 
    const collection = db.collection("shopifyOrders"); 

    const totalOrders = await collection.countDocuments();

    res.status(200).json({
      success: true,
      message: "order count fetched from DB",
      totalOrders: totalOrders
    });
  } catch (error) {
    console.log("error in getTotalOrderCount Fn: ", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

