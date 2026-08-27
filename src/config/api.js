const trimTrailingSlash = (url) => String(url || "").replace(/\/+$/, "");

export const toHttpUrl = (url) => {
  const value = String(url || "").trim();
  if (value.startsWith("https://")) {
    return `http://${value.slice("https://".length)}`;
  }
  return value;
};

export const SITE_URL = trimTrailingSlash(
  import.meta.env.VITE_SITE_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "https://ghsuperwinnings.com")
);

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || `${SITE_URL}/api`
);

export const HE_SITE_URL = trimTrailingSlash(
  toHttpUrl(import.meta.env.VITE_HE_SITE_URL || SITE_URL)
);

export const HE_API_BASE_URL = trimTrailingSlash(
  toHttpUrl(import.meta.env.VITE_HE_API_BASE_URL || `${HE_SITE_URL}/api`)
);

export const ADMIN_API_BASE = `${API_BASE_URL}/admin`;

export const apiUrl = (path = "") => {
  const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
