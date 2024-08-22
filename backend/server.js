import express from "express";
import dotenv from "dotenv";
import { dbConnection } from "./DB/dbConnection.js";
import customerRoutes from "./routes/customerRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import cors from "cors";
import productsRoutes from "./routes/productRoutes.js";

const app = express();

const corsOptions = {
  // origin: ['https://ecommerce-dashboard-a3ap.onrender.com', 'http://localhost:3000'],
  origin: '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

dotenv.config();
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

//products routes
app.use("/api/products", productsRoutes);

app.listen(process.env.PORT || 3010, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
