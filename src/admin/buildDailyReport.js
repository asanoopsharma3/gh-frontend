const DAILY_OFFER_CODE = "9923310010";
const TOPUP_OFFER_CODE = "9923310009";
const DAILY_PRICE_GHS = 1;

const ghanaDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
};

const eachDate = (from, to) => {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const last = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export const toGhs = (value, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  if (numeric >= 50) return Number((numeric / 100).toFixed(2));
  return Number(numeric.toFixed(2));
};

const compact = (value) => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

const classifyRow = (row = {}) => {
  const status = compact(row.status || row.rawStatus);
  const lifecycle = compact(row.lifecycle || row.subscriberLifeCycle);
  const reason = String(row.reason || "").toLowerCase();
  const command = compact(row.command);
  const offerCode = String(row.offerCode || DAILY_OFFER_CODE);
  const source = String(row.source || "").toUpperCase();

  if (lifecycle.includes("unsub") || command.includes("unsub") || status.includes("unsub")) return "unsub";
  if (lifecycle.startsWith("ren") || reason.includes("renew") || command.includes("renew")) return "renewal";
  if (
    ["2", "26", "29", "55", "63", "111", "g"].includes(status) ||
    reason.includes("insufficient") ||
    reason.includes("low balance") ||
    reason.includes("churn")
  ) {
    return "churn";
  }
  if (["9", "115"].includes(status) || status.includes("alreadysubscrib") || (status.includes("already") && status.includes("subscrib"))) {
    return "already_subscribed";
  }
  if (offerCode === TOPUP_OFFER_CODE) return "topup";
  if (["1", "11", "12", "13", "91", "112", "150", "186", "644", "1316", "failed", "failure", "fail", "d", "s"].includes(status)) {
    return "failed";
  }

  const success = ["a", "200", "0", "00", "ok", "active", "activated", "success", "successful", "succuss", "subscribed"].includes(status);
  const newLifecycle = !lifecycle || ["sub", "new", "newsub", "activation", "activated"].includes(lifecycle);
  if (success && newLifecycle) return "new";
  if (source.includes("USER") && success) return "new";
  return "other";
};

export const buildDailyReportFromEvents = (rows = [], params = {}) => {
  const today = ghanaDate(new Date());
  const from = String(params.from || params.fromDate || today).slice(0, 10);
  const to = String(params.to || params.toDate || from).slice(0, 10);
  const dates = eachDate(from <= to ? from : to, from <= to ? to : from);
  const dateSet = new Set(dates);

  const events = rows
    .map((row) => {
      const createdAt = row.createdAt || row.callbackTimestamp || row.subscriptionStartTime;
      const date = ghanaDate(createdAt);
      const type = classifyRow(row);
      const offerCode = String(row.offerCode || DAILY_OFFER_CODE);
      const billed = toGhs(row.priceGhs ?? row.chargingAmount ?? row.chargeAmount);
      const priceGhs = billed || (["new", "renewal", "topup"].includes(type) ? DAILY_PRICE_GHS : 0);
      return {
        ...row,
        msisdn: String(row.msisdn || row.phone || "").replace(/\D/g, ""),
        offerCode,
        planName: offerCode === TOPUP_OFFER_CODE ? "Daily Top-up" : "Daily Subscription",
        type,
        priceGhs,
        chargingAmount: priceGhs,
        createdAt,
        date,
        flow: row.flow || row.channel || "UNKNOWN",
        source: row.source || "CGW",
      };
    })
    .filter((row) => row.msisdn && dateSet.has(row.date));

  const unique = new Map();
  for (const event of events) {
    const key = `${event.type}|${event.date}|${event.msisdn}`;
    if (!unique.has(key)) unique.set(key, event);
  }
  const uniqueEvents = [...unique.values()];
  const newSubscriptions = uniqueEvents.filter((event) => event.type === "new");
  const uniqueUsers = new Set(newSubscriptions.map((event) => event.msisdn));
  const sumPrice = (type) =>
    Number(
      uniqueEvents
        .filter((event) => event.type === type)
        .reduce((sum, event) => sum + Number(event.priceGhs || 0), 0)
        .toFixed(2)
    );

  const grouped = new Map(dates.map((date) => [date, []]));
  for (const event of newSubscriptions) {
    grouped.get(event.date)?.push(event);
  }

  const daily = dates.map((date) => {
    const subscriptions = (grouped.get(date) || []).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    return {
      date,
      newSubscriptions: subscriptions.length,
      revenueGhs: Number(subscriptions.reduce((sum, event) => sum + Number(event.priceGhs || 0), 0).toFixed(2)),
      subscriptions,
    };
  });

  return {
    success: true,
    view: from === to ? "daily" : "range",
    timezone: "Africa/Accra",
    currency: "GHS",
    plans: [
      { code: DAILY_OFFER_CODE, name: "Daily Subscription", amountGhs: DAILY_PRICE_GHS, billing: "daily" },
      { code: TOPUP_OFFER_CODE, name: "Daily Top-up", amountGhs: DAILY_PRICE_GHS, billing: "one-time" },
    ],
    range: { from, to },
    summary: {
      newSubscriptions: newSubscriptions.length,
      uniqueUsers: uniqueUsers.size,
      renewals: uniqueEvents.filter((event) => event.type === "renewal").length,
      alreadySubscribed: uniqueEvents.filter((event) => event.type === "already_subscribed").length,
      churn: uniqueEvents.filter((event) => event.type === "churn").length,
      unsub: uniqueEvents.filter((event) => event.type === "unsub").length,
      topup: uniqueEvents.filter((event) => event.type === "topup").length,
      failed: uniqueEvents.filter((event) => event.type === "failed").length,
      newRevenueGhs: sumPrice("new"),
      renewalRevenueGhs: sumPrice("renewal"),
      topupRevenueGhs: sumPrice("topup"),
    },
    daily,
  };
};

export const isDailyReportPayload = (data) =>
  Boolean(data && Array.isArray(data.daily) && data.summary && data.summary.newSubscriptions != null);
