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

// Function to get the top 10 most sold products of all time
export const getTop10Products = async (req, res) => {
  try {
    // Access the database and collection
    const db = conn.connection.db;
    const collection = db.collection('shopifyOrders'); // Adjust the collection name if needed

    // Aggregate pipeline to get top 10 most sold products
    const topProducts = await collection.aggregate([
      // Unwind the line_items array
      { $unwind: "$line_items" },

      // Group by product ID and count the total quantity sold
      { 
        $group: {
          _id: "$line_items.product_id", // Group by product ID
          totalSold: { $sum: "$line_items.quantity" }, // Sum of quantities sold
          productName: { $first: "$line_items.name" }, // Optional: Get the product name
          price: { $first: "$line_items.price" } // Optional: Get the product price
        }
      },

      // Sort by totalSold in descending order
      { $sort: { totalSold: -1 } },

      // Limit to top 10 products
      { $limit: 8 }
    ]).toArray();

    // Send the response
    res.status(200).json({
      success: true,
      message: "Top 10 most sold products fetched successfully",
      topProducts
    });
  } catch (error) {
    console.error("Error in getTop10Products function: ", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


