import axios from "axios";
import { ADMIN_API_BASES } from "../config/api";
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
    limit: Math.min(Number(config.params?.limit) || 10, 50),
  };
  return getAdminApi("/dashboard", { ...config, params });
}

export async function getDailySubscriptionApi(config) {
  const fromDate = config.params?.fromDate || config.params?.from;
  const toDate = config.params?.toDate || config.params?.to;
  const empty = {
    data: buildDailyReportFromEvents([], { from: fromDate, to: toDate, fromDate, toDate }),
  };

  try {
    const res = await getDashboardRows({
      ...config,
      params: {
        fromDate,
        toDate,
        report: "success",
        page: 1,
        limit: 50,
      },
    });

    if (isDailyReportPayload(res.data)) {
      return normalizePlanPrices(res);
    }

    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      data: buildDailyReportFromEvents(rows, { from: fromDate, to: toDate, fromDate, toDate }),
    };
  } catch (error) {
    if (error.response?.status === 401) throw error;
    return empty;
  }
}
