import axios from "axios";
import { ADMIN_API_BASES } from "../config/api";

const DAILY_SUBSCRIPTION_PATHS = [
  "/daily-subscriptions",
  "/dailysubscriptions",
  "/dailySubscriptions",
  "/new-subscriptions",
  "/reports/daily-subscriptions",
];

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
        if (![404, 405].includes(error.response?.status)) throw error;
      }
    }
  }

  throw lastError;
}

export function getDailySubscriptionApi(config) {
  return getAdminApi(DAILY_SUBSCRIPTION_PATHS, config);
}
