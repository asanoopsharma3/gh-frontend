import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./Subscribe.css";
import {
  INITIAL_OFFER_CODE,
  LOCAL_SUBSCRIPTION_ENABLED,
  activateLocalSubscription,
  normalizeGhanaMsisdn,
  startNheSubscription,
} from "../config/subscription";

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activatingLocally, setActivatingLocally] = useState(false);

  const offerCode =
    searchParams.get("offerCode") ||
    localStorage.getItem("offerCode") ||
    INITIAL_OFFER_CODE;

  const handleNheSubmit = async () => {
    const msisdn = normalizeGhanaMsisdn(phoneNumber);
    if (!msisdn || msisdn.length < 12) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Number",
        text: "Please enter a valid MTN mobile number.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    localStorage.setItem("offerCode", offerCode);

    if (LOCAL_SUBSCRIPTION_ENABLED) {
      setActivatingLocally(true);
      try {
        const result = await activateLocalSubscription(msisdn, offerCode);
        const params = new URLSearchParams({
          token: result.token,
          status: "success",
          offerCode: result.offerCode || offerCode,
        });
        window.location.href = `/activation/callback?${params.toString()}`;
      } catch (error) {
        setActivatingLocally(false);
        Swal.fire({
          icon: "error",
          title: "Local Activation Failed",
          text:
            error.message ||
            "Could not activate subscription locally. Check backend ENABLE_LOCAL_SUBSCRIPTION=true.",
          confirmButtonColor: "#1683f5",
        });
      }
      return;
    }

    startNheSubscription(msisdn, offerCode);
  };

  return (
    <div className="subscribe-page min-h-screen flex items-center justify-center text-white">
      <div className="subscribe-card w-full max-w-lg rounded-2xl border border-white/20 bg-black/80 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="subscribe-header">
          <h1 className="subscribe-title text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Subscribe
          </h1>
          {LOCAL_SUBSCRIPTION_ENABLED && (
            <p className="subscribe-dev-note mt-3 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
              Local dev mode: subscription activates directly in your MongoDB without MTN billing.
            </p>
          )}
        </div>

        <div className="subscribe-field">
          <label htmlFor="mtn-number" className="subscribe-label block text-left text-sm font-medium text-gray-200">
            Mobile number
          </label>
          <div className="flex min-h-14 items-stretch overflow-hidden rounded-xl border border-white/20 bg-white shadow-sm transition focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-400/15">
            <span className="subscribe-prefix flex items-center border-r border-gray-200 bg-gray-100 font-semibold text-gray-700">
              +233
            </span>
            <input
              id="mtn-number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value.replace(/\D/g, "").slice(0, 10))}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleNheSubmit();
              }}
              placeholder="Enter MTN number"
              className="subscribe-input min-w-0 flex-1 bg-white text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
         
        </div>

        <button
          type="button"
          onClick={handleNheSubmit}
          disabled={activatingLocally}
          className="subscribe-button w-full rounded-xl bg-yellow-400 text-base font-bold text-black shadow-[0_10px_30px_rgba(250,204,21,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-300/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {activatingLocally
            ? "Activating..."
            : LOCAL_SUBSCRIPTION_ENABLED
              ? "Activate Locally"
              : "Proceed to Subscribe"}
        </button>
      </div>
    </div>
  );
}
