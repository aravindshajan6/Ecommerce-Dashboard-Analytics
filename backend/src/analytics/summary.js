/**
 * KPI header: current vs previous period with 12-point sparklines.
 */
import { resolveRange, sliceByTs, round2, pct, round4 } from "./util.js";

/** Raw KPI values for orders in [from, to] (to exclusive when `toExclusive`). */
export function computeKpis(state, from, to, toExclusive = false) {
  const orders = sliceByTs(state.orders, from, to, toExclusive);
  const { customerStats } = state.indexes;
  let revenue = 0;
  let units = 0;
  let refunded = 0;
  const customers = new Set();
  const returning = new Set();
  for (const o of orders) {
    revenue += o.total;
    units += o.units;
    if (o.financialStatus === "refunded" || o.financialStatus === "partially_refunded") refunded++;
    if (o.customerId) {
      customers.add(o.customerId);
      // returning: this order is not the customer's first ever order
      const s = customerStats.get(o.customerId);
      if (s && o.ts > s.firstTs) returning.add(o.customerId);
    }
  }
  const fromTs = from ? new Date(from).getTime() : -Infinity;
  const toTs = to ? new Date(to).getTime() : Infinity;
  let newCustomers = 0;
  for (const c of state.customers) {
    if (c.ts == null) continue;
    if (c.ts >= fromTs && (toExclusive ? c.ts < toTs : c.ts <= toTs)) newCustomers++;
  }
  const orderCount = orders.length;
  return {
    revenue: round2(revenue),
    orders: orderCount,
    customers: customers.size,
    newCustomers,
    aov: orderCount ? round2(revenue / orderCount) : 0,
    unitsSold: units,
    repeatRate: customers.size ? round4(returning.size / customers.size) : 0,
    refundRate: orderCount ? round4(refunded / orderCount) : 0,
  };
}

export function getSummary(state, { range = "12m", now = Date.now() } = {}) {
  const r = resolveRange(range, now, state.indexes.earliestTs);
  const current = computeKpis(state, r.from, r.to);
  const previous = r.previousFrom ? computeKpis(state, r.previousFrom, r.previousTo, true) : null;

  // sparklines: 12 equal slices of the current period
  const fromTs = r.from.getTime();
  const toTs = r.to.getTime();
  const step = (toTs - fromTs) / 12;
  const slices = [];
  for (let i = 0; i < 12; i++) {
    const a = fromTs + i * step;
    const b = i === 11 ? toTs : fromTs + (i + 1) * step;
    slices.push(computeKpis(state, a, b, i !== 11));
  }

  const kpis = {};
  for (const key of Object.keys(current)) {
    const value = current[key];
    const prev = previous ? previous[key] : null;
    kpis[key] = {
      value,
      previous: prev,
      delta: prev == null ? null : round2(value - prev),
      deltaPct: prev == null ? null : pct(value, prev),
      spark: slices.map((s) => s[key]),
    };
  }
  return {
    range: r.range,
    from: r.from.toISOString(),
    to: r.to.toISOString(),
    previousFrom: r.previousFrom ? r.previousFrom.toISOString() : null,
    previousTo: r.previousTo ? r.previousTo.toISOString() : null,
    currency: state.currency,
    kpis,
  };
}
