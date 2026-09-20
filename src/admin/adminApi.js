import axios from "axios";
import { ADMIN_API_BASES } from "../config/api";
import { buildDailyReportFromEvents, isDailyReportPayload, toGhs } from "./buildDailyReport";

const DAILY_OFFER = "9923310010";

const ghanaDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
};

const inRange = (value, fromDate, toDate) => {
  const day = ghanaDay(value);
  if (!day) return false;
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
};

const uniqueRows = (rows) => {
  const seen = new Set();
  const list = [];
  for (const row of rows) {
    const key = `${row.msisdn || ""}|${String(row.createdAt || "").slice(0, 16)}|${row.type || row.status || ""}`;
    if (!row.msisdn || seen.has(key)) continue;
    seen.add(key);
    list.push(row);
  }
  return list;
};

export async function getAdminApi(path, config) {
  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  let lastError;

  for (const baseUrl of ADMIN_API_BASES) {
    try {
      return await axios.get(`${baseUrl}${normalizedPath}`, config);
    } catch (error) {
      lastError = error;
      if (error.response?.status === 401) throw error;
      if (![404, 405, 500].includes(error.response?.status)) throw error;
    }
  }

  throw lastError;
}

const normalizePlanPrices = (res) => {
  const plans = Array.isArray(res.data?.plans)
    ? res.data.plans.map((plan) => ({
        ...plan,
        amountGhs: toGhs(plan.amountGhs, 1) || 1,
      }))
    : res.data?.plans;
  return {
    ...res,
    data: {
      ...res.data,
      plans,
      summary: {
        ...res.data?.summary,
        totalGhsAmount: toGhs(res.data?.summary?.totalGhsAmount, 0),
        newRevenueGhs: toGhs(res.data?.summary?.newRevenueGhs, 0),
      },
    },
  };
};

export async function getDashboardRows(config) {
  const params = {
    fromDate: config.params?.fromDate || config.params?.from,
    toDate: config.params?.toDate || config.params?.to,
    report: config.params?.report || "all",
    page: config.params?.page || 1,
    limit: Math.min(Number(config.params?.limit) || 50, 50),
  };
  return getAdminApi("/dashboard", { ...config, params });
}

const mapActiveUser = (user) => ({
  id: user._id,
  msisdn: String(user.phone || "").replace(/\D/g, ""),
  offerCode: DAILY_OFFER,
  planName: "Daily Subscription",
  reason: "-",
  lifecycle: "SUB",
  status: "success",
  rawStatus: "active",
  type: "new",
  chargingAmount: 1,
  priceGhs: 1,
  source: "USER",
  createdAt: user.subscriptionStartTime || user.createdAt,
});

async function loadActiveUsers(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;
  const res = await getAdminApi("/users", {
    headers: config.headers,
    signal: config.signal,
    params: { subscriptionStatus: "active" },
  });
  const users = Array.isArray(res.data?.users) ? res.data.users : [];
  const rows = uniqueRows(
    users
      .filter((user) => String(user.subscriptionStatus || "").toLowerCase() === "active" && user.phone)
      .map(mapActiveUser)
      .filter((row) => inRange(row.createdAt, fromDate, toDate))
  );
  const report = buildDailyReportFromEvents(rows, { from: fromDate, to: toDate, fromDate, toDate });
  return {
    data: {
      ...report,
      data: rows,
      subscribers: rows,
      total: rows.length,
      summary: {
        ...report.summary,
        totalSubscribers: report.summary.uniqueUsers,
        success: report.summary.newSubscriptions,
        totalGhsAmount: report.summary.newRevenueGhs,
      },
    },
  };
}

const flattenPayloadRows = (payload = {}) => {
  const tableRows = Array.isArray(payload.data) ? payload.data : [];
  const named = Array.isArray(payload.subscribers) ? payload.subscribers : [];
  const dailyRows = (Array.isArray(payload.daily) ? payload.daily : []).flatMap((day) =>
    (day.subscriptions || []).map((row) => ({
      ...row,
      status: row.status || "success",
      type: row.type || "new",
      chargingAmount: row.priceGhs ?? row.chargingAmount ?? 1,
    }))
  );
  return uniqueRows([...named, ...dailyRows, ...tableRows]);
};

export async function getSubscriberReport(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;
  const report = config.params?.report || "success";

  try {
    const res = await getDashboardRows({
      ...config,
      params: { fromDate, toDate, report, page: 1, limit: 50 },
    });
    const payload = res.data || {};
    const rows = flattenPayloadRows(payload);
    if (rows.length || (Array.isArray(payload.daily) && payload.daily.some((day) => day.newSubscriptions))) {
      const dailyPayload = isDailyReportPayload(payload)
        ? normalizePlanPrices(res).data
        : buildDailyReportFromEvents(rows, { from: fromDate, to: toDate, fromDate, toDate });
      return {
        data: {
          ...dailyPayload,
          data: rows,
          subscribers: rows,
          total: rows.length,
          summary: {
            ...dailyPayload.summary,
            totalSubscribers: dailyPayload.summary?.uniqueUsers ?? payload.summary?.totalSubscribers ?? rows.length,
            success: dailyPayload.summary?.newSubscriptions ?? payload.summary?.success ?? rows.length,
            totalGhsAmount: toGhs(
              dailyPayload.summary?.newRevenueGhs ?? payload.summary?.totalGhsAmount,
              rows.length
            ),
          },
        },
      };
    }
  } catch (error) {
    if (error.response?.status === 401) throw error;
  }

  try {
    return await loadActiveUsers(config);
  } catch (error) {
    if (error.response?.status === 401) throw error;
    return {
      data: {
        ...buildDailyReportFromEvents([], { from: fromDate, to: toDate, fromDate, toDate }),
        data: [],
        subscribers: [],
        total: 0,
      },
    };
  }
}

export async function getDailySubscriptionApi(config) {
  return getSubscriberReport({
    ...config,
    params: {
      ...config.params,
      report: "success",
    },
  });
}
