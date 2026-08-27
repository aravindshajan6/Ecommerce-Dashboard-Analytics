/**
 * Deterministic demo dataset generator producing Shopify-shaped documents
 * (`shopifyProducts`, `shopifyCustomers`, `shopifyOrders`).
 *
 * Same `seed` + same `now` => identical output. Dynamics modelled:
 *  - ~2.5x upward growth trend across the span
 *  - yearly seasonality (Nov/Dec peak, Jan/Feb trough)
 *  - weekly pattern (weekend lift) and hour-of-day peaks (11-13h, 19-22h)
 *  - power-law product popularity with slow per-product drift
 *  - ~35% repeat buyers with decaying re-purchase probability
 *  - city mix weighted to India + US + UK + EU + SEA (store currency INR)
 */
import { findCity } from "./cities.js";

const DAY = 86_400_000;

// ---------- PRNG (mulberry32) ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed) {
  const rand = mulberry32(seed);
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const weighted = (items, weights) => {
    let total = 0;
    for (const w of weights) total += w;
    let r = rand() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  const poisson = (lambda) => {
    if (lambda > 30) {
      // normal approximation for large lambda
      const u = rand() || 1e-9;
      const v = rand();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
    }
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= rand();
    } while (p > L);
    return k - 1;
  };
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return { rand, int, pick, weighted, poisson, shuffle };
}

// ---------- catalog definitions ----------
const CATEGORIES = [
  { type: "Apparel", price: [499, 2499], titles: ["Classic Cotton Tee", "Linen Summer Shirt", "Slim Fit Chinos", "Oversized Hoodie", "Denim Jacket", "Athleisure Joggers", "Kurta Set", "Graphic Sweatshirt"] },
  { type: "Footwear", price: [999, 4999], titles: ["Everyday Sneakers", "Trail Runners", "Leather Loafers", "Canvas Slip-ons", "Chunky Sandals", "Ankle Boots", "Running Shoes Pro"] },
  { type: "Electronics", price: [799, 12999], titles: ["Wireless Earbuds", "Bluetooth Speaker Mini", "Smartwatch Series 3", "USB-C Fast Charger 65W", "Noise Cancelling Headphones", "Power Bank 20000mAh", "4K Action Camera", "Mechanical Keyboard"] },
  { type: "Home & Kitchen", price: [399, 5999], titles: ["Ceramic Dinner Set", "Cast Iron Skillet", "Air Fryer 4L", "Scented Soy Candle", "Bamboo Cutting Board", "French Press", "Memory Foam Pillow", "Copper Water Bottle"] },
  { type: "Beauty & Personal Care", price: [249, 1499], titles: ["Vitamin C Serum", "Hydrating Face Mist", "Beard Grooming Kit", "Sunscreen SPF 50", "Argan Hair Oil", "Charcoal Face Wash", "Matte Lipstick Set"] },
  { type: "Sports & Outdoors", price: [299, 5999], titles: ["Yoga Mat Pro", "Adjustable Dumbbells", "Resistance Bands Set", "Insulated Shaker Bottle", "Cycling Helmet", "Camping Tent 2P", "Skipping Rope"] },
  { type: "Accessories", price: [399, 3999], titles: ["Leather Wallet", "Minimalist Watch", "Polarized Sunglasses", "Canvas Backpack", "Laptop Sleeve 14in", "Silk Scarf", "Woven Belt", "Travel Duffel"] },
  { type: "Books & Stationery", price: [149, 1299], titles: ["Dotted Notebook A5", "Fountain Pen", "Desk Planner", "Watercolor Set", "Fiction Bundle (3 books)", "Wooden Desk Organizer", "Sticker Pack"] },
];

const VENDORS = ["Nordic Threads", "UrbanKart", "Zenith Electronics", "HomeCraft Co.", "Lumière Beauty", "PeakForm", "Artisan Leatherworks", "Paperwhale", "Sunrise Textiles", "Vector Gear"];

const FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Ananya", "Diya", "Aadhya", "Saanvi", "Priya", "Isha", "Kavya", "Meera", "Riya", "Neha", "Rahul", "Karan", "Amit", "Nikhil", "Sneha", "Pooja", "Anjali", "Deepak", "Sanjay", "Lakshmi", "James", "Emma", "Olivia", "Liam", "Noah", "Ava", "Sophia", "Mason", "Lucas", "Mia", "Ethan", "Amelia", "Harper", "Oliver", "Charlotte", "Jack", "Grace", "Leo", "Chloe", "Daniel", "Hannah", "Wei", "Mei", "Yuki", "Haruto", "Minh", "Siti", "Aisha", "Omar", "Fatima", "Zara", "Lucia", "Mateo", "Sofia", "Elena", "Luca", "Marco", "Anna", "Jonas", "Felix", "Lena", "Nina", "Tom", "Ben", "Sam"];
const LAST_NAMES = ["Sharma", "Verma", "Patel", "Reddy", "Nair", "Iyer", "Menon", "Singh", "Gupta", "Mehta", "Joshi", "Kumar", "Rao", "Das", "Bose", "Chatterjee", "Kapoor", "Malhotra", "Shah", "Desai", "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Clark", "Lewis", "Walker", "Hall", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Tan", "Lim", "Lee", "Wong", "Nguyen", "Tran", "Kim", "Sato", "Suzuki", "Müller", "Schmidt", "Fischer", "Weber", "Rossi", "Russo", "García", "Martínez", "López", "Dubois", "Martin", "Bernard", "Ali", "Khan", "Hassan", "Ahmed", "Okafor", "Mensah", "Silva", "Santos"];

/** weighted city mix for the store (names must exist in cities.js) */
const CITY_WEIGHTS = [
  ["Mumbai", 9], ["Bengaluru", 9], ["Delhi", 8], ["Chennai", 5], ["Hyderabad", 5], ["Pune", 4], ["Kolkata", 3.5], ["Ahmedabad", 2], ["Jaipur", 1.5], ["Gurugram", 1.5], ["Noida", 1], ["Kochi", 1], ["Surat", 1], ["Lucknow", 1], ["Chandigarh", 0.8], ["Indore", 0.8], ["Coimbatore", 0.7],
  ["New York", 4], ["San Francisco", 3], ["Los Angeles", 2], ["Chicago", 1.5], ["Seattle", 1.5], ["Austin", 1], ["Boston", 1], ["Dallas", 0.8], ["Miami", 0.7],
  ["London", 4], ["Manchester", 1.2], ["Birmingham", 0.8], ["Edinburgh", 0.6],
  ["Berlin", 1.5], ["Paris", 1.5], ["Amsterdam", 1.2], ["Munich", 0.8], ["Madrid", 0.8], ["Dublin", 0.8], ["Barcelona", 0.6], ["Stockholm", 0.5], ["Zurich", 0.5], ["Milan", 0.5],
  ["Singapore", 2.5], ["Kuala Lumpur", 1.2], ["Bangkok", 1], ["Jakarta", 0.8], ["Manila", 0.6], ["Ho Chi Minh City", 0.5], ["Hong Kong", 0.8],
  ["Dubai", 2], ["Abu Dhabi", 0.6], ["Doha", 0.4], ["Riyadh", 0.5],
  ["Sydney", 1.5], ["Melbourne", 1.2], ["Toronto", 1.5], ["Vancouver", 0.8], ["Tokyo", 1], ["Seoul", 0.5], ["Colombo", 0.4], ["Nairobi", 0.3], ["Johannesburg", 0.3], ["Cape Town", 0.3],
];

const SEASON = [0.78, 0.82, 0.95, 1.0, 1.03, 0.97, 1.0, 1.06, 1.05, 1.15, 1.38, 1.5]; // Jan..Dec
const DOW = [1.18, 0.88, 0.86, 0.9, 0.95, 1.05, 1.22]; // Sun..Sat
const HOURS = [0.3, 0.2, 0.15, 0.1, 0.1, 0.2, 0.4, 0.7, 1.0, 1.3, 1.6, 2.2, 2.4, 2.1, 1.5, 1.3, 1.3, 1.4, 1.7, 2.3, 2.6, 2.7, 2.2, 1.0];
const CHANNELS = ["web", "mobile_app", "pos", "instagram", "other"];
const CHANNEL_W = [62, 22, 9, 4, 3];

const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
const iso = (ms) => new Date(ms).toISOString();

export function generateDataset({ seed = 42, now = Date.now(), targetOrders = 9000, targetCustomers = 1500, start = Date.UTC(2023, 0, 1) } = {}) {
  const rng = makeRng(Number(seed) || 42);
  const nowMs = typeof now === "number" ? now : new Date(now).getTime();
  const cityEntries = CITY_WEIGHTS.map(([name, w]) => [findCity(name), w]).filter(([c]) => c);
  const cityList = cityEntries.map(([c]) => c);
  const cityW = cityEntries.map(([, w]) => w);

  // ---------- products ----------
  const products = [];
  let pIdx = 0;
  for (const cat of CATEGORIES) {
    for (const title of cat.titles) {
      const id = 8000000000 + pIdx;
      const base = rng.int(cat.price[0], cat.price[1]);
      const price = Math.round(base / 10) * 10 - 1; // e.g. 1499
      const vendor = VENDORS[(pIdx * 7 + rng.int(0, 2)) % VENDORS.length];
      const skuBase = `${cat.type.replace(/[^A-Z]/g, "")}${String(pIdx + 1).padStart(3, "0")}`;
      const variantCount = rng.rand() < 0.3 ? 2 : 1;
      const variants = [];
      for (let v = 0; v < variantCount; v++) {
        variants.push({
          id: 9000000000 + pIdx * 10 + v,
          product_id: id,
          title: variantCount === 1 ? "Default Title" : v === 0 ? "Standard" : "Large",
          price: money(v === 0 ? price : price * 1.2),
          sku: `${skuBase}-${v === 0 ? "STD" : "LRG"}`,
          inventory_quantity: rng.int(25, 480),
          inventory_management: "shopify",
        });
      }
      const createdAt = start - rng.int(10, 120) * DAY;
      products.push({
        id,
        title,
        body_html: `<p>${title} by ${vendor}.</p>`,
        vendor,
        product_type: cat.type,
        status: "active",
        tags: cat.type.toLowerCase(),
        created_at: iso(createdAt),
        updated_at: iso(createdAt),
        variants,
        image: null,
      });
      pIdx++;
    }
  }
  // stock alerts: 6 low, 3 out (deterministic picks)
  const stockPicks = rng.shuffle(products.map((_, i) => i)).slice(0, 9);
  stockPicks.slice(0, 6).forEach((i) => products[i].variants.forEach((v, vi) => (v.inventory_quantity = vi === 0 ? rng.int(1, 9) : 0)));
  stockPicks.slice(6).forEach((i) => products[i].variants.forEach((v) => (v.inventory_quantity = 0)));

  // popularity: power law over a shuffled rank + slow drift
  const ranks = rng.shuffle(products.map((_, i) => i));
  const popularity = new Array(products.length);
  const drift = new Array(products.length);
  ranks.forEach((prodIndex, rank) => {
    popularity[prodIndex] = 1 / Math.pow(rank + 1, 0.8);
    drift[prodIndex] = rng.rand() * 1.5 - 0.5; // -0.5 .. +1.0 relative change across the span
  });

  // ---------- day-level intensity ----------
  const days = [];
  const spanDays = Math.max(1, Math.floor((nowMs - start) / DAY));
  let intensitySum = 0;
  for (let i = 0; i <= spanDays; i++) {
    const dayMs = start + i * DAY;
    if (dayMs > nowMs) break;
    const d = new Date(dayMs);
    const progress = i / spanDays;
    const trend = 1 + 1.5 * progress; // 1x -> 2.5x
    const intensity = trend * SEASON[d.getUTCMonth()] * DOW[d.getUTCDay()];
    days.push({ dayMs, intensity, progress });
    intensitySum += intensity;
  }
  const perUnit = targetOrders / intensitySum;
  const newCustomerShare = targetCustomers / targetOrders;

  // ---------- customers + orders ----------
  const customers = [];
  const customerMeta = []; // { id, repeater, lastOrderMs, orders }
  const repeaters = []; // indexes into customerMeta
  const orders = [];
  const emailSeen = new Set();

  const newCustomer = (orderMs) => {
    const idx = customers.length;
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    let email = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z.]/g, "");
    let n = 0;
    while (emailSeen.has(`${email}${n || ""}@example.com`)) n++;
    email = `${email}${n || ""}@example.com`;
    emailSeen.add(email);
    const city = rng.weighted(cityList, cityW);
    const createdMs = orderMs - rng.int(0, 72) * 3_600_000;
    const doc = {
      id: 7000000000 + idx,
      email,
      first_name: first,
      last_name: last,
      created_at: iso(createdMs),
      updated_at: iso(createdMs),
      state: "enabled",
      verified_email: true,
      currency: "INR",
      orders_count: 0,
      total_spent: "0.00",
      default_address: {
        city: city.city,
        province: null,
        country: city.country,
        country_code: city.countryCode,
        latitude: city.lat,
        longitude: city.lng,
      },
    };
    customers.push(doc);
    const meta = { idx, repeater: rng.rand() < 0.35, lastOrderMs: orderMs, orders: 0, city };
    customerMeta.push(meta);
    if (meta.repeater) repeaters.push(idx);
    return idx;
  };

  const pickExisting = (orderMs) => {
    if (!repeaters.length) return null;
    // decaying re-purchase probability: weight = exp(-days since last order / 150)
    const weights = repeaters.map((i) => {
      const m = customerMeta[i];
      const daysSince = Math.max(0, (orderMs - m.lastOrderMs) / DAY);
      return Math.exp(-daysSince / 150) * (1 + 0.15 * Math.min(m.orders, 6)) + 0.01;
    });
    return rng.weighted(repeaters, weights);
  };

  let orderIdx = 0;
  for (const { dayMs, intensity, progress } of days) {
    const count = rng.poisson(intensity * perUnit);
    for (let k = 0; k < count; k++) {
      const hour = rng.weighted(HOURS.map((_, h) => h), HOURS);
      const orderMs = dayMs + hour * 3_600_000 + rng.int(0, 59) * 60_000 + rng.int(0, 59) * 1000;
      if (orderMs > nowMs) continue;

      let cIdx = null;
      if (rng.rand() >= newCustomerShare) cIdx = pickExisting(orderMs);
      if (cIdx == null) cIdx = newCustomer(orderMs);
      const meta = customerMeta[cIdx];
      const cust = customers[cIdx];
      meta.orders += 1;
      meta.lastOrderMs = orderMs;

      // line items
      const itemCount = rng.weighted([1, 2, 3, 4], [55, 27, 12, 6]);
      const weights = popularity.map((p, i) => p * (1 + drift[i] * progress));
      const chosen = new Set();
      const lineItems = [];
      let subtotal = 0;
      for (let li = 0; li < itemCount; li++) {
        let pi = rng.weighted(products.map((_, i) => i), weights);
        if (chosen.has(pi)) continue;
        chosen.add(pi);
        const product = products[pi];
        const variant = product.variants[rng.rand() < 0.75 ? 0 : product.variants.length - 1];
        const quantity = rng.weighted([1, 2, 3], [78, 17, 5]);
        const price = Number(variant.price);
        subtotal += price * quantity;
        lineItems.push({
          id: 6000000000 + orderIdx * 10 + li,
          product_id: product.id,
          variant_id: variant.id,
          title: product.title,
          name: variant.title === "Default Title" ? product.title : `${product.title} - ${variant.title}`,
          sku: variant.sku,
          vendor: product.vendor,
          quantity,
          price: money(price),
          fulfillable_quantity: 0,
          requires_shipping: true,
        });
      }
      const discountRate = rng.rand() < 0.2 ? rng.int(5, 20) / 100 : 0;
      const discount = subtotal * discountRate;
      const shipping = subtotal - discount >= 999 ? 0 : 99;
      const tax = (subtotal - discount) * 0.18;
      const total = subtotal - discount + tax + shipping;

      const ageDays = (nowMs - orderMs) / DAY;
      let financial = rng.weighted(["paid", "refunded", "pending", "voided"], [91, 4, 3, 2]);
      if (financial === "pending" && ageDays > 30) financial = "paid"; // pending only plausible for recent orders
      if (financial === "refunded" && ageDays < 2) financial = "paid";
      let fulfillment = null;
      if (financial === "paid" || financial === "refunded") {
        if (ageDays > 3) fulfillment = rng.rand() < 0.96 ? "fulfilled" : "partial";
        else if (ageDays > 1) fulfillment = rng.rand() < 0.5 ? "fulfilled" : null;
      }
      const channel = rng.weighted(CHANNELS, CHANNEL_W);
      const shipCity = rng.rand() < 0.9 ? meta.city : rng.weighted(cityList, cityW);
      const id = 5000000000 + orderIdx;
      const orderNumber = 1001 + orderIdx;
      orders.push({
        id,
        name: `#${orderNumber}`,
        order_number: orderNumber,
        email: cust.email,
        created_at: iso(orderMs),
        updated_at: iso(orderMs + rng.int(1, 72) * 3_600_000),
        processed_at: iso(orderMs),
        currency: "INR",
        financial_status: financial,
        fulfillment_status: fulfillment,
        source_name: channel,
        customer_id: cust.id,
        customer: { id: cust.id, first_name: cust.first_name, last_name: cust.last_name, email: cust.email },
        line_items: lineItems,
        subtotal_price: money(subtotal),
        total_discounts: money(discount),
        total_tax: money(tax),
        total_price: money(total),
        total_price_set: { shop_money: { amount: money(total), currency_code: "INR" } },
        total_shipping_price_set: { shop_money: { amount: money(shipping), currency_code: "INR" } },
        shipping_address: {
          city: shipCity.city,
          country: shipCity.country,
          country_code: shipCity.countryCode,
          latitude: shipCity.lat,
          longitude: shipCity.lng,
        },
      });
      orderIdx++;
    }
  }

  orders.sort((a, b) => (a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0));
  // renumber sequentially by time so order numbers grow with time
  orders.forEach((o, i) => {
    o.id = 5000000000 + i;
    o.order_number = 1001 + i;
    o.name = `#${o.order_number}`;
  });
  // customer aggregates
  const spent = new Map();
  for (const o of orders) {
    const s = spent.get(o.customer_id) ?? { n: 0, amt: 0 };
    s.n += 1;
    s.amt += Number(o.total_price);
    spent.set(o.customer_id, s);
  }
  for (const c of customers) {
    const s = spent.get(c.id);
    if (s) {
      c.orders_count = s.n;
      c.total_spent = money(s.amt);
    }
  }
  return { customers, products, orders };
}

export default generateDataset;
