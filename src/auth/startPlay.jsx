import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../axiosInstance";
import { INITIAL_OFFER_CODE } from "../config/subscription";
import { useAuth } from "./AuthContext";

function StartPlay() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const token = localStorage.getItem("token");

  const goToFirstSubscription = useCallback(
    async (message) => {
      localStorage.removeItem("payment_done");
      localStorage.setItem("offerCode", INITIAL_OFFER_CODE);
      await Swal.fire({
        icon: "warning",
        title: "Subscription Required",
        text: message || "Please subscribe to start playing.",
        confirmButtonText: "Subscribe",
        confirmButtonColor: "#1683f5",
      });
      logout(false);
      navigate(`/subscribe?fallback=true&offerCode=${INITIAL_OFFER_CODE}`, { replace: true });
    },
    [logout, navigate]
  );

  const loadSubscriptionStatus = useCallback(async () => {
    if (!token) {
      await goToFirstSubscription("Please subscribe first to continue.");
      return null;
    }

    try {
      const res = await axios.get("/subscription/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.subscription;
    } catch (err) {
      if (err.response?.status === 401) {
        await goToFirstSubscription("Your session expired. Please subscribe again.");
        return null;
      }

      await Swal.fire({
        icon: "error",
        title: "Unable to Start",
        text: "Could not verify your subscription. Please try again.",
        confirmButtonColor: "#1683f5",
      });
      return null;
    }
  }, [goToFirstSubscription, token]);

  const decidePlayRoute = useCallback(async () => {
    setChecking(true);
    try {
      const subscription = await loadSubscriptionStatus();
      if (!subscription) return;

      if (subscription.subscriptionStatus !== "active") {
        await goToFirstSubscription(subscription.message);
        return;
      }

      if (subscription.quizAccessStatus === "topup_required" || !subscription.canPlay) {
        localStorage.removeItem("payment_done");
        navigate("/topup", { replace: true });
        return;
      }

      localStorage.setItem("payment_done", "true");
      navigate("/quiz", { replace: true });
    } finally {
      setChecking(false);
    }
  }, [goToFirstSubscription, loadSubscriptionStatus, navigate]);

  useEffect(() => {
    if (!token) return;
    void loadSubscriptionStatus().then((subscription) => {
      if (subscription && subscription.subscriptionStatus !== "active") {
        void goToFirstSubscription(subscription.message);
      }
    });
  }, [goToFirstSubscription, loadSubscriptionStatus, token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center text-white opacity-90">
      <div className="start-banner">
        <h3>
          READY TO PLAY
          <br />
          YOUR 10 QUESTION
          <br />
          CHALLENGE
        </h3>
        <button
          className="glow-on-hover mt2"
          type="button"
          disabled={checking}
          onClick={() => void decidePlayRoute()}
        >
          {checking ? "Checking..." : "Play"}
        </button>
      </div>
    </div>
  );
}

export default StartPlay;
