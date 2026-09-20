import axios from "axios";
import { ADMIN_API_BASE, ADMIN_API_BASES } from "../config/api";
import { buildDailyReportFromEvents, isDailyReportPayload, toGhs } from "./buildDailyReport";

export async function getAdminApi(paths, config) {
  const pathList = (Array.isArray(paths) ? paths : [paths]).map((path) =>
    String(path).startsWith("/") ? path : `/${path}`
  );
  let lastError;

  for (const baseUrl of ADMIN_API_BASES) {
    for (const path of pathList) {
      try {
        return await axios.get(`${baseUrl}${path}`, config);
      } catch (error) {
        lastError = error;
        if (error.response?.status === 401) throw error;
        if (![404, 405, 500].includes(error.response?.status)) throw error;
      }
    }
  }

  throw lastError;
}

const withDailyParams = (config = {}) => ({
  ...config,
  params: {
    ...(config.params || {}),
    view: "daily",
    report: "all",
    page: 1,
    limit: 500,
  },
});

const asAxiosData = (res, data) => ({
  ...res,
  data,
});

export async function getDailySubscriptionApi(config) {
  const dailyConfig = withDailyParams(config);
  let lastError;

  try {
    const res = await getAdminApi("/dashboard", dailyConfig);
    if (isDailyReportPayload(res.data)) {
      return normalizePlanPrices(res);
    }
    if (Array.isArray(res.data?.data)) {
      return asAxiosData(res, buildDailyReportFromEvents(res.data.data, dailyConfig.params));
    }
  } catch (error) {
    if (error.response?.status === 401) throw error;
    lastError = error;
  }

  try {
    const res = await getAdminApi("/subscriptions", dailyConfig);
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return asAxiosData(res, buildDailyReportFromEvents(rows, dailyConfig.params));
  } catch (error) {
    if (error.response?.status === 401) throw error;
    lastError = error;
  }

  try {
    const res = await axios.get(`${ADMIN_API_BASE}/daily-subscriptions`, config);
    if (isDailyReportPayload(res.data)) return normalizePlanPrices(res);
  } catch (error) {
    if (error.response?.status === 401) throw error;
    lastError = error;
  }

  throw lastError || new Error("Unable to load daily subscriptions");
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
    },
  };
};
