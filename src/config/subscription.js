import { API_BASE_URL, SITE_URL } from "./api";

export { SITE_URL, API_BASE_URL };

export const INITIAL_OFFER_CODE = "9923310010";
export const TOPUP_OFFER_CODE = "9923310009";
export const TOPUP_REQUIRED_MESSAGE =
  "You have exhausted your 10 set of questions for the day.\nPlease top up to get additional 10 set of questions.";
export const HE_MOBILE_NUMBER = "99999999999";
export const CGW_BACKEND_CALLBACK_URL = `${API_BASE_URL}/callback`;
export const CGW_ENV = import.meta.env.VITE_CGW_ENV || "staging";

export const CGW_NHE_PORTAL_URL =
  CGW_ENV === "staging"
    ? "https://sitcg.mtn.com.gh/Portal"
    : "https://cg.mtn.com.gh/Portal";

export const isMobileDevice = () => {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  if (navigator.userAgentData?.mobile === true) {
    return true;
  }

  const ua = navigator.userAgent || "";
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk|SamsungBrowser/i.test(
      ua
    )
  ) {
    return true;
  }

  // Chrome/Safari device toolbar and small phone screens should still start HE.
  return Boolean(window.matchMedia?.("(max-width: 729px)")?.matches);
};

export const isMobileNetworkCandidate = () => {
  // Always try MTN header enrichment on mobile view/devices.
  // Do not block on navigator.connection.type === "wifi": Chrome often reports
  // wifi in device toolbar and on some Ghana Android browsers even on mobile data.
  // The HE portal itself only attaches MSISDN on the operator network.
  return isMobileDevice();
};

const toHttpUrl = (url) => {
  const value = String(url || "");
  if (value.startsWith("https://")) return `http://${value.slice("https://".length)}`;
  return value;
};

export const startHeSubscription = (offerCode = INITIAL_OFFER_CODE) => {
  if (import.meta.env.DEV) {
    window.location.assign(
      `/subscribe?fallback=true&offerCode=${encodeURIComponent(offerCode)}`
    );
    return;
  }

  const captureUrl = new URL(toHttpUrl(`${API_BASE_URL}/cgw/he-redirect`));
  captureUrl.searchParams.set("offerCode", offerCode);
  window.location.href = captureUrl.toString();
};

export const startNheSubscription = (msisdn, offerCode = INITIAL_OFFER_CODE) => {
  const callbackUrl = new URL(CGW_BACKEND_CALLBACK_URL);
  callbackUrl.searchParams.set("flow", "NHE");
  const params = new URLSearchParams({
    OfferCode: offerCode,
    redirectUrl: callbackUrl.toString(),
    mobileNumber: msisdn,
  });

  window.location.href = `${CGW_NHE_PORTAL_URL}?${params.toString()}`;
};

export const normalizeGhanaMsisdn = (phoneNumber) => {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return `233${digits}`;
};

export const LOCAL_SUBSCRIPTION_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_SUBSCRIPTION === "true";

export const activateLocalSubscription = async (msisdn, offerCode = INITIAL_OFFER_CODE) => {
  const response = await fetch(`${API_BASE_URL}/subscription/dev-activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn, offerCode }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success || !data?.token) {
    throw new Error(data?.message || "Local subscription activation failed");
  }

  return data;
};

export const unsubscribeCurrentUser = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}/subscription/unsubscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    const error = new Error(
      data?.message || "Unable to unsubscribe right now. Please try again."
    );
    error.status = response.status;
    error.description = data?.description || data?.mtn?.description || "";
    error.mtn = data?.mtn || null;
    throw error;
  }

  return data;
};






