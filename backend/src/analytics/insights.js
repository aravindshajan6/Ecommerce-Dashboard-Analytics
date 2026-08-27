/**
 * Auto-generated insight cards from real numbers in the loaded dataset.
 */
import { resolveRange, sliceByTs, round2, pct, mean, stddev, bucketKey, DAY } from "./util.js";
import { computeKpis } from "./summary.js";
import { productStats, inventory } from "./products.js";
import { getChannels, getCategories } from "./sales.js";

const fmtMoney = (n, currency) => `${currency === "INR" ? "₹" : currency + " "}${Math.round(n).toLocaleString("en-IN")}`;
const fmtPct = (n) => `${n > 0 ? "+" : ""}${round2(n)}%`;

export function getInsights(state, { range = "30d", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const cur = computeKpis(state, r.from, r.to);
  const prev = r.previousFrom ? computeKpis(state, r.previousFrom, r.previousTo, true) : null;
  const currency = state.currency;
  const cards = [];
  const push = (card) => cards.push({ id: `insight-${cards.length + 1}`, delta: null, ...card });

  // 1. revenue vs previous period
  if (prev && prev.revenue) {
    const d = pct(cur.revenue, prev.revenue);
    push({
      type: d >= 0 ? "positive" : "negative",
      title: d >= 0 ? "Revenue is up" : "Revenue is down",
      body: `${fmtMoney(cur.revenue, currency)} in the last ${range} versus ${fmtMoney(prev.revenue, currency)} in the previous period (${fmtPct(d)}). Orders ${fmtPct(pct(cur.orders, prev.orders) ?? 0)}.`,
      metric: "revenue",
      value: cur.revenue,
      delta: d,
      href: "/sales",
    });
  } else {
    push({ type: "neutral", title: "Revenue to date", body: `${fmtMoney(cur.revenue, currency)} across ${cur.orders} orders.`, metric: "revenue", value: cur.revenue, href: "/sales" });
  }

  // 2. AOV shift
  if (prev && prev.aov) {
    const d = pct(cur.aov, prev.aov);
    if (Math.abs(d) >= 1) {
      push({
        type: d >= 0 ? "positive" : "negative",
        title: `Average order value ${d >= 0 ? "rose" : "fell"} ${Math.abs(d)}%`,
        body: `Customers now spend ${fmtMoney(cur.aov, currency)} per order versus ${fmtMoney(prev.aov, currency)} before. ${d >= 0 ? "Bundles and upsells are landing." : "Consider bundles or free-shipping thresholds to lift basket size."}`,
        metric: "aov",
        value: cur.aov,
        delta: d,
        href: "/sales",
      });
    }
  }

  // 3. best-selling product momentum
  const curStats = productStats(state, r.from, r.to);
  const prevStats = prev ? productStats(state, r.previousFrom, new Date(r.previousTo.getTime() - 1)) : new Map();
  const top = [...curStats.values()].sort((a, b) => b.units - a.units)[0];
  if (top) {
    const before = prevStats.get(top.id)?.units ?? 0;
    const d = pct(top.units, before);
    push({
      type: d == null ? "neutral" : d >= 0 ? "positive" : "negative",
      title: `${top.title} is the best seller`,
      body: `${top.units} units and ${fmtMoney(top.revenue, currency)} in the period${d != null ? `, ${fmtPct(d)} versus the previous period` : ""}.`,
      metric: "units",
      value: top.units,
      delta: d,
      href: "/products",
    });
    // fastest riser among products with meaningful volume
    const risers = [...curStats.values()]
      .filter((s) => s.units >= 10 && (prevStats.get(s.id)?.units ?? 0) >= 5)
      .map((s) => ({ s, d: pct(s.units, prevStats.get(s.id).units) }))
      .filter((x) => x.d != null && x.s.id !== top.id)
      .sort((a, b) => b.d - a.d);
    if (risers.length && risers[0].d >= 25) {
      const { s, d } = risers[0];
      push({ type: "positive", title: `${s.title} is gaining momentum`, body: `Units sold jumped ${fmtPct(d)} to ${s.units}. Worth featuring on the homepage.`, metric: "units", value: s.units, delta: d, href: "/products" });
    }
  }

  // 4. biggest city
  const cityMap = new Map();
  let cityTotal = 0;
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    if (!o.city) continue;
    const c = cityMap.get(o.city) ?? { city: o.city, country: o.country, revenue: 0, orders: 0 };
    c.revenue += o.total;
    c.orders += 1;
    cityTotal += o.total;
    cityMap.set(o.city, c);
  }
  const topCity = [...cityMap.values()].sort((a, b) => b.revenue - a.revenue)[0];
  if (topCity) {
    const share = cityTotal ? round2((topCity.revenue / cityTotal) * 100) : 0;
    push({
      type: "neutral",
      title: `${topCity.city} leads with ${share}% of revenue`,
      body: `${topCity.orders} orders worth ${fmtMoney(topCity.revenue, currency)} came from ${topCity.city}${topCity.country ? `, ${topCity.country}` : ""}. ${cityMap.size} cities ordered in total.`,
      metric: "revenue",
      value: topCity.revenue,
      href: "/customers",
    });
  }

  // 5. stockouts
  const inv = inventory(state, { now });
  if (inv.out + inv.low > 0) {
    const names = inv.alerts.slice(0, 3).map((a) => a.title).join(", ");
    push({
      type: "alert",
      title: `${inv.out} product${inv.out === 1 ? "" : "s"} out of stock, ${inv.low} running low`,
      body: `Restock soon: ${names}${inv.alerts.length > 3 ? ` and ${inv.alerts.length - 3} more` : ""}.`,
      metric: "stock",
      value: inv.out + inv.low,
      href: "/products",
    });
  }

  // 6. unusual days (z-score > 2 on daily revenue)
  const daily = new Map();
  for (const o of sliceByTs(state.orders, r.from, r.to)) {
    const k = bucketKey(o.createdAt, "daily");
    daily.set(k, (daily.get(k) ?? 0) + o.total);
  }
  const vals = [...daily.values()];
  if (vals.length >= 7) {
    const m = mean(vals);
    const sd = stddev(vals) || 1;
    const unusual = [...daily.entries()].map(([day, v]) => ({ day, v, z: (v - m) / sd })).filter((x) => Math.abs(x.z) > 2).sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    if (unusual.length) {
      const u = unusual[0];
      push({
        type: u.z > 0 ? "positive" : "negative",
        title: u.z > 0 ? `Unusual spike on ${u.day}` : `Unusual dip on ${u.day}`,
        body: `${fmtMoney(u.v, currency)} in revenue that day, ${round2(Math.abs(u.z))} standard deviations ${u.z > 0 ? "above" : "below"} the daily average of ${fmtMoney(m, currency)}. ${unusual.length} unusual day${unusual.length === 1 ? "" : "s"} in the period.`,
        metric: "revenue",
        value: round2(u.v),
        delta: round2(((u.v - m) / m) * 100),
        href: "/orders",
      });
    }
  }

  // 7. repeat-rate change
  if (prev) {
    const d = round2((cur.repeatRate - prev.repeatRate) * 100);
    push({
      type: d >= 0 ? "positive" : "negative",
      title: `Returning-customer rate ${d >= 0 ? "up" : "down"} ${Math.abs(d)} pts`,
      body: `${round2(cur.repeatRate * 100)}% of customers who ordered had bought before, versus ${round2(prev.repeatRate * 100)}% in the previous period.`,
      metric: "repeatRate",
      value: cur.repeatRate,
      delta: d,
      href: "/customers",
    });
  }

  // 8. refund rate
  if (cur.refundRate >= 0.03) {
    push({
      type: "alert",
      title: `Refund rate at ${round2(cur.refundRate * 100)}%`,
      body: `${Math.round(cur.refundRate * cur.orders)} of ${cur.orders} orders were refunded${prev ? ` (previous period ${round2(prev.refundRate * 100)}%)` : ""}. Review product quality and delivery issues.`,
      metric: "refundRate",
      value: cur.refundRate,
      delta: prev ? round2((cur.refundRate - prev.refundRate) * 100) : null,
      href: "/orders",
    });
  }

  // 9. channel mix
  const channels = getChannels(state, { range, now });
  if (channels.length > 1) {
    const c = channels[0];
    push({
      type: "neutral",
      title: `${c.channel.replace("_", " ")} drives ${round2(c.share * 100)}% of revenue`,
      body: `${c.orders} orders via ${c.channel.replace("_", " ")}; ${channels[1].channel.replace("_", " ")} is second at ${round2(channels[1].share * 100)}%.`,
      metric: "revenue",
      value: c.revenue,
      href: "/sales",
    });
  }

  // 10. category momentum
  if (prev) {
    const curCat = getCategories(state, { range, now });
    const prevOrders = sliceByTs(state.orders, r.previousFrom, r.previousTo, true);
    const prevByCat = new Map();
    for (const o of prevOrders) for (const li of o.lineItems) {
      const cat = state.indexes.productById.get(li.productId)?.category ?? "Uncategorized";
      prevByCat.set(cat, (prevByCat.get(cat) ?? 0) + li.price * li.quantity);
    }
    const moves = curCat.map((c) => ({ c, d: pct(c.revenue, prevByCat.get(c.category) ?? 0) })).filter((x) => x.d != null).sort((a, b) => b.d - a.d);
    if (moves.length) {
      const best = moves[0];
      push({
        type: best.d >= 0 ? "positive" : "negative",
        title: `${best.c.category} ${best.d >= 0 ? "grew" : "shrank"} ${Math.abs(best.d)}%`,
        body: `${fmtMoney(best.c.revenue, currency)} from ${best.c.category} (${round2(best.c.share * 100)}% of category revenue).`,
        metric: "revenue",
        value: best.c.revenue,
        delta: best.d,
        href: "/sales",
      });
    }
  }

  return cards.slice(0, 10);
}
