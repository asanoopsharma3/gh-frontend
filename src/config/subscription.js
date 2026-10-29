import { API_BASE_URL, SITE_URL } from "./api";

export { SITE_URL, API_BASE_URL };

export const INITIAL_OFFER_CODE = "9923310010";
export const NHE_SUBSCRIBE_PATH = "/subscribe?fallback=true";
export const TOPUP_OFFER_CODE = "9923310009";
export const TOPUP_REQUIRED_MESSAGE =
  "You have exhausted your 10 set of questions for the day.\nPlease top up to get additional 10 set of questions.";
export const HE_MOBILE_NUMBER = "99999999999";
export const CGW_BACKEND_CALLBACK_URL = `${API_BASE_URL}/callback`;
export const CGW_ENV = import.meta.env.VITE_CGW_ENV || "staging";

export const HE_REDIRECT_URL =
  import.meta.env.VITE_HE_REDIRECT_URL || "http://20.238.64.101/Redirect";

export const CGW_NHE_PORTAL_URL =
  CGW_ENV === "staging"
    ? "https://sitcg.mtn.com.gh/Portal"
    : "https://cgnp.mtn.com.gh/Portal";

export const FORCE_HE =
  import.meta.env.DEV && import.meta.env.VITE_FORCE_HE === "true";

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

  return Boolean(window.matchMedia?.("(max-width: 729px)")?.matches);
};

export const isMobileNetworkCandidate = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const connectionType = connection?.type?.toLowerCase();
  if (connectionType === "wifi") return false;

  return isMobileDevice();
};

const PRODUCTION_CALLBACK_URL = "https://ghsuperwinnings.com/api/callback";

const isLocalHost = (hostname) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

// MTN rejects localhost and any redirectUrl that already contains "?".
// CGNP appends "?CGID=...&offerId=...&msisdn=...&status=..." itself.
const buildPlainCallbackUrl = () => {
  const preferred = import.meta.env.VITE_HE_CALLBACK_URL || CGW_BACKEND_CALLBACK_URL;
  let callbackUrl;
  try {
    callbackUrl = new URL(preferred);
  } catch {
    callbackUrl = new URL(PRODUCTION_CALLBACK_URL);
  }
  if (isLocalHost(callbackUrl.hostname)) {
    callbackUrl = new URL(PRODUCTION_CALLBACK_URL);
  }
  callbackUrl.search = "";
  callbackUrl.hash = "";
  return callbackUrl.toString();
};

export const normalizeGhanaMsisdn = (phoneNumber) => {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  return `233${digits}`;
};

export const LOCAL_HE_MSISDN = normalizeGhanaMsisdn(
  import.meta.env.VITE_LOCAL_HE_MSISDN || "257294199"
);

export const getHeRedirectParams = (offerCode = INITIAL_OFFER_CODE) => {
  const number = FORCE_HE && LOCAL_HE_MSISDN ? LOCAL_HE_MSISDN : HE_MOBILE_NUMBER;
  return {
    OfferCode: offerCode,
    redirectUrl: buildPlainCallbackUrl(),
    mobileNumber: number,
    msisdn: number,
  };
};

export const startHeSubscription = (offerCode = INITIAL_OFFER_CODE) => {
  localStorage.setItem("offerCode", offerCode);
  const params = new URLSearchParams(getHeRedirectParams(offerCode));
  window.location.replace(`${HE_REDIRECT_URL}?${params.toString()}`);
};

export const startNheSubscription = (msisdn, offerCode = INITIAL_OFFER_CODE) => {
  const number = normalizeGhanaMsisdn(msisdn);
  const params = new URLSearchParams({
    OfferCode: offerCode,
    redirectUrl: buildPlainCallbackUrl(),
    mobileNumber: number,
    msisdn: number,
  });

  window.location.href = `${CGW_NHE_PORTAL_URL}?${params.toString()}`;
};

export const LOCAL_SUBSCRIPTION_ENABLED =
  import.meta.env.DEV &&
  !FORCE_HE &&
  import.meta.env.VITE_LOCAL_SUBSCRIPTION === "true";

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
