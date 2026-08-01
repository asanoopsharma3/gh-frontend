import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useContext } from "react";
import { UserContext } from "../context/context";
import { useEffect } from "react";
import Swal from 'sweetalert2';
import { apiUrl } from "../config/api";


export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const mobile = location.state?.mobile || "";
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
    const {setphone}= useContext(UserContext);

    useEffect(()=>{
      setphone(mobile);
    },[])
  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Invalid OTP",
        text: "Please enter a valid 6 digit OTP.",
        confirmButtonColor: "#1683f5",
      });
      return setError("Enter a valid OTP");
    }
    setError("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        apiUrl("/sms/verify-otp"),
        { phone: mobile, otp }
      );

      setLoading(false);

      if (data.success) {
        // ✅ Save JWT and user info for future use
        await Swal.fire({
          icon: "success",
          title: "Verification Successful",
          text: "Your number has been verified successfully.",
          timer: 1400,
          showConfirmButton: false,
        });

        
        localStorage.setItem("token", data.token); 
        localStorage.setItem("userId", data.user._id); // save user ID from backend
        localStorage.setItem("phone", data.user.phone);
        login(data.token); // Update AuthContext state

        navigate("/start/play"); // redirect to start play
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid OTP",
          text: data.error || "Invalid OTP. Please try again.",
          confirmButtonColor: "#1683f5",
        });
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: "Failed to verify OTP. Please try again.",
        confirmButtonColor: "#1683f5",
      });
      setError("Failed to verify OTP");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 sm:px-6 md:px-12 lg:px-24">
      <div className="data-form w-full max-w-md">
        <h4>ENTER OTP</h4>
        <p>
          A one time password has been sent to <strong>{mobile}</strong>
        </p>
        <input
          type="text"
          placeholder="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          autoComplete="off"
          className="w-full"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          className="primary w-full"
          onClick={verifyOtp}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Login"}
        </button>
      </div>
    </div>
  );
}
