import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";
import { TOPUP_OFFER_CODE } from "../config/subscription";

export default function ActivationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const status = (searchParams.get("status") || "").toLowerCase();
    const reason =
      searchParams.get("reason") ||
      searchParams.get("message") ||
      "We could not complete your subscription.";
    const offerCode =
      searchParams.get("offerCode") ||
      localStorage.getItem("offerCode") ||
      "";
    const isTopup =
      offerCode === TOPUP_OFFER_CODE ||
      searchParams.get("flow") === "topup";

    const isSuccess =
      status === "success" ||
      status === "successful" ||
      searchParams.get("success") === "true" ||
      searchParams.get("subscribed") === "true";

    if (isSuccess && token) {
      login(token);
      localStorage.setItem("payment_done", "true");
      if (offerCode) {
        localStorage.setItem("offerCode", offerCode);
      }

      Swal.fire({
        icon: "success",
        title: isTopup ? "Top-up Successful" : "Subscription Successful",
        text: isTopup
          ? "You can now continue playing."
          : "You are subscribed. Let's play!",
        confirmButtonText: isTopup ? "Start Quiz" : "Continue",
        confirmButtonColor: "#1683f5",
      }).then(() => {
        navigate(isTopup ? "/quiz" : "/start/play", { replace: true });
      });
      return;
    }

    localStorage.removeItem("payment_done");
    Swal.fire({
      icon: "error",
      title: "Subscription Failed",
      text: reason,
      confirmButtonText: "Try Again",
      confirmButtonColor: "#1683f5",
    }).then(() =>
      navigate(
        isTopup
          ? "/topup?payment=failed"
          : "/subscribe?fallback=true",
        { replace: true }
      )
    );
  }, [login, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        <p>Verifying subscription...</p>
      </div>
    </div>
  );
}
