import { conn } from "../DB/dbConnection.js";

export const getTotalProducts = async (req, res) => {
  console.log("inside getTotalProducts fn");
  try {
    if (!conn) {
      console.log("no connection with MongoDB");
    }

    const db = conn.connection.db; 
    const collection = db.collection("shopifyProducts"); 


    const totalProducts = await collection.countDocuments();

    res.status(200).json({
      success: true,
      message: "products count fetched from DB",
      totalProducts: totalProducts,
    });
  } catch (error) {
    console.log("error in getTotalProducts Fn: ", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};
