/**
 * Seed MongoDB with the generated demo dataset.
 *   MONGODB_URI=... node scripts/seed.js [--seed 42]
 * Replaces the shopifyOrders / shopifyCustomers / shopifyProducts collections.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { generateDataset } from "../src/data/generator.js";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required to seed the database.");
  process.exit(1);
}
const seedArg = process.argv.indexOf("--seed");
const seed = Number(seedArg > -1 ? process.argv[seedArg + 1] : process.env.DEMO_SEED) || 42;

function dbNameFromUri(u) {
  const m = u.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return m && m[1] ? decodeURIComponent(m[1]) : null;
}

const dbName = dbNameFromUri(uri) ?? "RQ_Analytics";
const conn = await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
const db = conn.connection.db;
console.log(`Connected to ${conn.connection.host}/${dbName}. Generating dataset (seed ${seed})...`);

const data = generateDataset({ seed, now: Date.now() });
const collections = { shopifyProducts: data.products, shopifyCustomers: data.customers, shopifyOrders: data.orders };

for (const [name, docs] of Object.entries(collections)) {
  await db.collection(name).drop().catch((err) => {
    if (err.codeName !== "NamespaceNotFound" && err.code !== 26) throw err;
  });
  for (let i = 0; i < docs.length; i += 1000) await db.collection(name).insertMany(docs.slice(i, i + 1000));
  console.log(`${name}: ${await db.collection(name).countDocuments()} documents`);
}
await db.collection("shopifyOrders").createIndex({ created_at: 1 }).catch(() => {});
await mongoose.disconnect();
console.log("Done.");
