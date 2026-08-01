import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { UserContext } from "../context/context";
import { apiUrl } from "../config/api";

export default function Otplogin() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
    const {setphone}= useContext(UserContext);
  const formatPhone = (phone) =>
    phone.startsWith("+") ? phone.trim() : "+268" + phone.trim();

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!mobile) return setError("Please enter a mobile number");
    const phone = formatPhone(mobile);
    setphone(phone);
    if (!/^\+268\d{8}$/.test(phone))
      return setError("Mobile number must be 8 digits");
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        apiUrl("/sms/send-otp"),
        { phone },
        { withCredentials: true }
      );

      setLoading(false);

      if (data.success) {
        setResendTimer(60);
        navigate("/otp/verify", { state: { mobile: phone } });
        console.log("OTP sent to:", phone);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      setLoading(false);
      setError("Error sending OTP");
    }
  };

  return (
   <div className="flex flex-col items-center justify-center h-screen text-center md:px-4 lg:px-24 w-full">
  <div className="data-form w-full max-w-xs md:max-w-md ">
        <h4>LOGIN</h4>
        <p>Please enter your Mobile number</p>
        <input
          type="text"
          placeholder="Mobile number"
          value={mobile}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val) && val.length <= 8) setMobile(val);
          }}
          maxLength={8}
          autoComplete="off"
          className="w-full"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          className="primary w-full"
          onClick={sendOtp}
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Generate OTP"}
        </button>
      </div>
    </div>
  );
}