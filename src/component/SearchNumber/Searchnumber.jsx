import React, { useState } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Searchnumber() {
  const [inputvalue, setinputvalue] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!inputvalue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Mobile Number Required",
        text: "Please enter a valid mobile number.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    try {
      setLoading(true);
      setUserData(null);

      const res = await axios.post(
  `https://ghsuperwinnings.com/api/auth/searchbyphone`,
  { phone: inputvalue },
  { headers: { "Content-Type": "application/json" } }
);


      if (res.data && res.data.data) {
        setUserData(res.data.data);
      } else {
        Swal.fire({
          icon: "info",
          title: "User Not Found",
          text: "No user record was found for this mobile number.",
          confirmButtonColor: "#1683f5",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      Swal.fire({
        icon: "error",
        title: "Search Failed",
        text: "User not found or server error. Please try again.",
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen w-full flex flex-col items-center px-4">
      {/* 🔹 Search Section */}
      <div className="w-full flex flex-col gap-5 items-center mt-10">
        <div
          className="flex flex-col md:flex-row md:items-center gap-3 md:w-[40%] w-full border-2 border-yellow-400 bg-white shadow-md rounded-lg px-4 py-3 transition-all duration-300 relative top-10"
          style={{ borderRadius: "8px" }}
        >
          <label
            htmlFor="mobile"
            className="text-sm font-semibold text-gray-800 whitespace-nowrap"
          >
            Mobile Number
          </label>

          <input
            id="mobile"
            type="text"
            placeholder="+268xxxxxxxx"
            value={inputvalue}
            onChange={(e) => setinputvalue(e.target.value)}
            className="border border-yellow-400 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-yellow-400 outline-none text-sm transition-all duration-300"
          />

          <button
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 border border-yellow-400 text-yellow-500 text-sm font-medium px-4 py-2 rounded-md bg-white hover:bg-yellow-400 hover:text-black transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {loading ? "Searching..." : <><Search className="w-4 h-4" />Search</>}
          </button>
        </div>
      </div>

      {/* 🔹 Table Section */}
      {userData && (
        <div className="w-full flex justify-center mt-16 mb-10 relative top-17">
          <div className="w-full md:w-3/4 border-4 border-yellow-500 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(255,215,0,0.7)] bg-white text-gray-800">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-5 font-bold bg-yellow-400 text-black py-3 px-4">
              <span>USER ID</span>
              <span>PHONE</span>
              <span>VERIFIED</span>
              <span>ATTEMPT QUIZ</span>
              <span>LAST OTP SENT</span>
            </div>

            {/* Data Row */}
            <div className="md:grid md:grid-cols-5 flex flex-col md:items-center gap-2 py-4 px-4 border-t border-yellow-300 bg-yellow-50">
              <div className="font-mono text-gray-700 text-sm break-all">
                {userData._id}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-400 text-black font-bold flex items-center justify-center">
                  {userData.phone?.slice(-1)}
                </div>
                <span>{userData.phone}</span>
              </div>

              <div className="text-center">
                {userData.isPhoneVerified ? (
                  <span className="px-3 py-1 rounded-full bg-green-600 text-xs font-semibold text-white">
                    Yes
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-600 text-xs font-semibold text-white">
                    No
                  </span>
                )}
              </div>

              <div className="text-center">
                {userData.isAttemptQuiz ? (
                  <span className="px-3 py-1 rounded-full bg-blue-700 text-xs font-semibold text-blue-100">
                    Attempted
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-gray-600 text-xs font-semibold text-gray-200">
                    Not Yet
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-700 whitespace-nowrap">
                {new Date(userData.lastOtpSent).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
