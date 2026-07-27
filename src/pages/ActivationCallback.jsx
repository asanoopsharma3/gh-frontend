import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";
import { TOPUP_OFFER_CODE } from "../config/subscription";

export default function ActivationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

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
          : `/subscribe?fallback=true${offerCode ? `&offerCode=${offerCode}` : ""}`,
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
