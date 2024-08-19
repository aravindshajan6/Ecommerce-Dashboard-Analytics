import { conn } from "../DB/dbConnection.js";

export const getAllOrders = async ( req, res) => {
    console.log("inside get all order FN");
    try {
        if(!conn) {
            console.log("no connection with MongoDB");
        }
        
        const db = conn.connection.db; // Access the database object
        const collection = db.collection('shopifyOrders'); // Use your collection name

         // Log collection name and database name
         console.log("Collection Name: ", collection.collectionName);
         console.log("Database Name: ", db.databaseName);

         const orders = await collection.find({}).toArray();
         res.status(200).json({success: true, message: "order info fetched from DB", orders: orders
         });

    } catch (error) {
        console.log("error in getAllOrders Fn: ", error.message);
        res.status(400).json({success: false, message: error.message });
    }
}