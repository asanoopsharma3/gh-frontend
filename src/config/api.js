const trimTrailingSlash = (url) => String(url || "").replace(/\/+$/, "");

export const SITE_URL = trimTrailingSlash(
  import.meta.env.VITE_SITE_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "https://ghsuperwinnings.com")
);

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || `${SITE_URL}/api`
);

export const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

export const apiUrl = (path = "") => {
  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
