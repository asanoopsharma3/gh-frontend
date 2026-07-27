export const SITE_URL =
  import.meta.env.VITE_SITE_URL || window.location.origin;
export const API_BASE_URL = `${SITE_URL}/api`;

export const INITIAL_OFFER_CODE = "9923310010";
export const TOPUP_OFFER_CODE = "9923310009";
export const HE_MOBILE_NUMBER = "99999999999";
export const CGW_BACKEND_CALLBACK_URL = `${API_BASE_URL}/callback`;
export const CGW_ENV = import.meta.env.VITE_CGW_ENV || "staging";

export const CGW_NHE_PORTAL_URL =
  CGW_ENV === "staging"
    ? "https://sitcg.mtn.com.gh/Portal"
    : "https://cg.mtn.com.gh/Portal";

export const isMobileNetworkCandidate = () => {
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const connectionType = connection?.type?.toLowerCase();

  // Match the proven GhanaGameium flow: mobile uses HE unless Wi-Fi is explicitly detected.
  // Browsers that do not expose connection.type must still be allowed to use MTN HE.
  return isMobileDevice && connectionType !== "wifi";
};

export const startHeSubscription = (offerCode = INITIAL_OFFER_CODE) => {
  const callbackUrl = new URL(CGW_BACKEND_CALLBACK_URL);
  callbackUrl.searchParams.set("flow", "HE");
  const params = new URLSearchParams({
    offerCode,
    redirectUrl: callbackUrl.toString(),
    mobileNumber: HE_MOBILE_NUMBER,
  });

  window.location.href = `${API_BASE_URL}/cgw/he-redirect?${params.toString()}`;
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






