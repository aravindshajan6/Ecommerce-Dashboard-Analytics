import {conn, dbConnection} from "../DB/dbConnection.js";


export const getAllCustomers = async (req, res) => {
    console.log("inside getAllCustomers route");
    try {
        if (!conn) {
            throw new Error('Database connection not established');
        }

        const db = conn.connection.db; // Access the database object
        const collection = db.collection('shopifyCustomers'); // Use your collection name

         // Log collection name and database name
         console.log("Collection Name: ", collection.collectionName);
         console.log("Database Name: ", db.databaseName);

        const customers = await collection.find({}).toArray();
        // console.log("customers : ", customers);
        res.status(200).json({success: true, message: "customers info fetched from DB", customers: customers
        });

    } catch (error) {
        console.log("error in getAllCustomers : ", error.message);
    }
    
}