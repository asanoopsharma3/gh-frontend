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
    },
  };
};

export async function getDailySubscriptionApi(config) {
  try {
    const rows = [];
    const params = {
      fromDate: config.params?.fromDate || config.params?.from,
      toDate: config.params?.toDate || config.params?.to,
      report: "success",
      sort: "desc",
      sortBy: "createdAt",
      limit: 50,
    };

    for (let page = 1; page <= 20; page += 1) {
      const res = await getAdminApi("/dashboard", {
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
      data: buildDailyReportFromEvents(rows, {
        from: params.fromDate,
        to: params.toDate,
        fromDate: params.fromDate,
        toDate: params.toDate,
      }),
    };
  } catch (error) {
    if (error.response?.status === 401) throw error;
    return {
      data: buildDailyReportFromEvents([], {
        from: config.params?.fromDate || config.params?.from,
        to: config.params?.toDate || config.params?.to,
      }),
    };
  }
}
