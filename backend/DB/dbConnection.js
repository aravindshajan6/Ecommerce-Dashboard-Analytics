import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let conn;

const dbConnection = async () => {
  console.log("inside dbConnection FN");
  try {
    conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected with ${conn.connection.host}`);
  } catch (error) {
    console.log("error in mongodb connection : ", error.message);
    process.exit(1);
  }
};

export { dbConnection, conn };
