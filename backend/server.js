import express from "express";
import dotenv from "dotenv";
import { dbConnection } from "./DB/dbConnection.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import cors from 'cors';

const app = express();
dotenv.config();
app.use(cors());

dbConnection();

app.get("/", (req, res) => {
  res.status(200).send("Hello World!");
});

//customer routes
app.use("/api/customers", customerRoutes);

//order routes
app.use("/api/orders", orderRoutes);

//sales routes
app.use("/api/sales", salesRoutes);

app.listen(process.env.PORT || 3010, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
