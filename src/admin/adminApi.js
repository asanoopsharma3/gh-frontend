import axios from "axios";
import { ADMIN_API_BASES } from "../config/api";
import { INITIAL_OFFER_CODE } from "../config/subscription";
import { buildDailyReportFromEvents, isDailyReportPayload, toGhs } from "./buildDailyReport";

export async function getAdminApi(path, config) {
  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  let lastError;

  for (const baseUrl of ADMIN_API_BASES) {
    try {
      return await axios.get(`${baseUrl}${normalizedPath}`, config);
    } catch (error) {
      lastError = error;
      if (error.response?.status === 401) throw error;
      if (![404, 405].includes(error.response?.status)) throw error;
    }
  }

  throw lastError;
}

const ghanaDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
};

const mapUsersToRows = (users = [], fromDate, toDate) =>
  users
    .map((user) => {
      const createdAt = user.subscriptionStartTime || user.createdAt;
      return {
        id: String(user._id || user.id || ""),
        msisdn: String(user.phone || "").replace(/\D/g, ""),
        offerCode: INITIAL_OFFER_CODE,
        reason: "User activation",
        lifecycle: "SUB",
        nextBillingDate: "",
        status: user.subscriptionStatus === "active" ? "success" : user.subscriptionStatus || "success",
        rawStatus: user.subscriptionStatus || "200",
        chargingAmount: 1,
        source: "User",
        createdAt,
      };
    })
    .filter((row) => {
      if (!row.msisdn || !row.createdAt) return false;
      const day = ghanaDay(row.createdAt);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    });

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
    },
  };
};

const loadUsersFallback = async (config, fromDate, toDate) => {
  const res = await getAdminApi("/users", { headers: config.headers, signal: config.signal });
  const rows = mapUsersToRows(res.data?.users || res.data?.data || [], fromDate, toDate);
  return {
    ...res,
    data: {
      success: true,
      data: rows,
      total: rows.length,
      summary: {
        totalSubscribers: rows.length,
        success: rows.length,
        renewals: 0,
        totalGhsAmount: rows.length,
      },
    },
  };
};

export async function getDashboardRows(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;
  const params = {
    fromDate,
    toDate,
    report: config.params?.report || "all",
    page: config.params?.page || 1,
    limit: Math.min(Number(config.params?.limit) || 10, 50),
  };

  try {
    return await getAdminApi("/dashboard", { ...config, params });
  } catch (error) {
    if (error.response?.status === 401) throw error;
    return loadUsersFallback(config, fromDate, toDate);
  }
}

export async function getDailySubscriptionApi(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;

  try {
    const rows = [];
    const params = {
      fromDate,
      toDate,
      report: "success",
      page: 1,
      limit: 50,
    };

    for (let page = 1; page <= 10; page += 1) {
      const res = await getDashboardRows({
        ...config,
        params: { ...params, page },
      });

      if (isDailyReportPayload(res.data)) {
        return normalizePlanPrices(res);
      }

      const batch = Array.isArray(res.data?.data) ? res.data.data : [];
      rows.push(...batch);
      const total = Number(res.data?.total);
      if (!batch.length || batch.length < params.limit) break;
      if (Number.isFinite(total) && rows.length >= total) break;
    }

    return {
      data: buildDailyReportFromEvents(rows, { from: fromDate, to: toDate, fromDate, toDate }),
    };
  } catch (error) {
    if (error.response?.status === 401) throw error;
    try {
      const fallback = await loadUsersFallback(config, fromDate, toDate);
      return {
        data: buildDailyReportFromEvents(fallback.data.data, { from: fromDate, to: toDate, fromDate, toDate }),
      };
    } catch {
      return {
        data: buildDailyReportFromEvents([], { from: fromDate, to: toDate }),
      };
    }
  }
}
