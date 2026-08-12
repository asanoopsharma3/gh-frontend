import { useEffect } from "react";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import {
  TOPUP_OFFER_CODE,
  TOPUP_REQUIRED_MESSAGE,
  isMobileNetworkCandidate,
  startHeSubscription,
} from "../../config/subscription";

export default function Topup() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("payment") !== "failed") return;

    Swal.fire({
      icon: "error",
      title: "Top-up Failed",
      text: "Please try again to unlock 10 more questions.",
      confirmButtonColor: "#1683f5",
    });
  }, [searchParams]);

  const handleProceed = () => {
    localStorage.setItem("offerCode", TOPUP_OFFER_CODE);
    if (isMobileNetworkCandidate()) {
      startHeSubscription(TOPUP_OFFER_CODE);
      return;
    }

    Swal.fire(
      "Unavailable",
      "Please use mobile data to top up.",
      "info"
    );
  };

  return (
    <div className="w-full flex justify-center items-center h-[90vh]">
      <div className="bg-black text-white rounded-2xl p-6 text-center w-[480px] h-[440px] flex flex-col justify-center items-center shadow-[0px_0px_5px_0px_white]">
        <h2 className="text-2xl font-bold mb-3 text-sky-400">Topup</h2>
        <p className="text-gray-200 mb-6 whitespace-pre-line">
          {TOPUP_REQUIRED_MESSAGE}
        </p>
        <p className="text-yellow-300 font-semibold">
          Top up with GHS 1.00 and keep playing!
        </p>
        <button
          onClick={handleProceed}
          className="p-3 m-4 mt-8 border border-gray-600 px-6 py-2 rounded-md hover:bg-gray-800"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
