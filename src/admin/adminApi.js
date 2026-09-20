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
  const report = config.params?.report || "all";
  const params = {
    fromDate: config.params?.fromDate || config.params?.from,
    toDate: config.params?.toDate || config.params?.to,
    report,
    page: config.params?.page || 1,
    limit: Math.min(Number(config.params?.limit) || 50, report === "renewal" || report === "churn" ? 500 : 50),
  };
  const res = await getAdminApi("/dashboard", { ...config, params });
  const payload = res.data || {};
  if (report === "renewal" && !payload.data?.length && payload.renewalRows?.length) {
    return { ...res, data: { ...payload, data: payload.renewalRows, total: payload.renewalRows.length } };
  }
  if (report === "churn" && !payload.data?.length && payload.churnRows?.length) {
    return { ...res, data: { ...payload, data: payload.churnRows, total: payload.churnRows.length } };
  }
  return res;
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

const compact = (value) => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

const classifyCallbackRow = (row = {}) => {
  const type = compact(row.type);
  if (["new", "renewal", "churn", "failed", "unsub"].includes(type)) return type;
  const status = compact(row.status || row.rawStatus || row.subscriptionStatus);
  const lifecycle = compact(row.lifecycle || row.subscriberLifeCycle);
  const reason = String(row.reason || "").toLowerCase();
  if (lifecycle.includes("unsub") || status.includes("unsub")) return "unsub";
  if (lifecycle.startsWith("ren") || lifecycle.includes("renew") || reason.includes("renew")) return "renewal";
  if (
    ["2", "26", "29", "55", "63", "111", "g"].includes(status) ||
    reason.includes("insufficient") ||
    reason.includes("low balance") ||
    reason.includes("churn")
  ) {
    return "churn";
  }
  if (["a", "0", "00", "200", "ok", "active", "success"].includes(status) && (!lifecycle || ["sub", "new"].includes(lifecycle))) {
    return "new";
  }
  return type || "other";
};

export async function getCallbackReport(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;
  const report = config.params?.report || "all";

  try {
    const res = await getDashboardRows({
      ...config,
      params: { fromDate, toDate, report, page: 1, limit: 50 },
    });
    const payload = res.data || {};
    const named =
      report === "renewal"
        ? payload.renewalRows
        : report === "churn"
          ? payload.churnRows
          : [];
    const rows = uniqueRows(
      [...(Array.isArray(named) ? named : []), ...(Array.isArray(payload.data) ? payload.data : [])].map((row) => {
        const type = classifyCallbackRow(row);
        return {
          ...row,
          type,
          status: row.status || type,
          rawStatus: row.rawStatus || row.status,
          lifecycle: row.lifecycle || row.subscriberLifeCycle || "",
        };
      })
    ).filter((row) => {
      if (report === "renewal") return row.type === "renewal";
      if (report === "churn") return row.type === "churn";
      return true;
    });

    return {
      data: {
        ...payload,
        data: rows,
        total: rows.length || Number(payload.total || 0),
        summary: payload.summary || {},
      },
    };
  } catch (error) {
    if (error.response?.status === 401) throw error;
    return { data: { data: [], total: 0, summary: {} } };
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
