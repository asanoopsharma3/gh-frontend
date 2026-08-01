import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Search } from "lucide-react";
import Swal from "sweetalert2";
import { apiUrl } from "../../config/api";

const MtntransactionUI = () => {
  const [payments, setPayments] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Fetch all transactions
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response1 = await axios.get(
        apiUrl("/mtn/payment/status"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const formattedPayments = response1.data.data.map((item) => ({
        _id: item._id,
        referenceId: item.subscriptionId,
        phone: item.phone,
        amount: "-",
        currency: "SZL",
        status: item.status,
        reason: item.rawResponse?.status || "-",
        createdAt: new Date(item.createdAt).toLocaleString(),
      }));

      setPayments(formattedPayments);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to fetch payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // 🔍 Search specific number
  const handleSearch = async () => {
    if (!inputValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone Required",
        text: "Please enter a valid phone number.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    try {
      setLoading(true);
      setSearchResult(null);
      const res = await axios.post(
        apiUrl("/mtn/details/payment-status"),
        { phone: inputValue },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success && res.data.data) {
        const item = res.data.data;
        const formatted = {
          _id: item._id,
          referenceId: item.subscriptionId,
          phone: item.phone,
          amount: "-",
          currency: "SZL",
          status: item.status,
          reason: item.rawResponse?.status || "-",
          createdAt: new Date(item.createdAt).toLocaleString(),
        };
        setSearchResult(formatted);
      } else {
        Swal.fire({
          icon: "info",
          title: "No Record Found",
          text: "No payment record was found for this phone number.",
          confirmButtonColor: "#1683f5",
        });
      }
    } catch (error) {
      console.error("Error searching payment:", error);
      Swal.fire({
        icon: "error",
        title: "Search Failed",
        text: "Error while searching payment status. Please try again.",
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🧾 Export to Excel
  const handleExport = () => {
    if (!payments.length) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "There are no payment records to export.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(payments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MTN Transactions");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "MTN_Transactions.xlsx");
    Swal.fire({
      icon: "success",
      title: "Export Started",
      text: `${payments.length} records are being exported.`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray p-6">
      <div className="max-w-6xl mx-auto bg-black rounded-2xl shadow-md p-6">
        {/* 🔍 Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-semibold text-white">
            💳 MTN Payment Transaction History
          </h2>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="+268xxxxxxxx"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border border-yellow-400 rounded-md px-3 py-2 w-full md:w-64 focus:ring-2 focus:ring-yellow-400 outline-none text-sm text-white"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-md transition-all duration-300"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
            >
              ⬇️ Export
            </button>
          </div>
        </div>

        {/* 🔹 Table */}
        {loading && <p className="text-center text-blue-500 font-semibold">Loading...</p>}
        {error && <p className="text-center text-red-500 font-semibold">{error}</p>}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Phone</th>
                  <th className="py-3 px-4 text-left">Reference ID</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Currency</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Reason</th>
                  <th className="py-3 px-4 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {/* 🔸 Show search result first if exists */}
                {searchResult && (
                  <tr className="bg-black border-b-2 border-yellow-400">
                    <td className="py-2 px-4 font-bold text-yellow-700">★</td>
                    <td className="py-2 px-4">{searchResult.phone}</td>
                    <td className="py-2 px-4">{searchResult.referenceId}</td>
                    <td className="py-2 px-4">{searchResult.amount}</td>
                    <td className="py-2 px-4">{searchResult.currency}</td>
                    <td
                      className={`py-2 px-4 font-semibold ${
                        searchResult.status === "SUCCESS"
                          ? "text-green-600"
                          : searchResult.status === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {searchResult.status}
                    </td>
                    <td className="py-2 px-4">{searchResult.reason}</td>
                    <td className="py-2 px-4">{searchResult.createdAt}</td>
                  </tr>
                )}

                {/* 🔹 Existing transactions */}
                {payments.map((payment, index) => (
                  <tr key={payment._id} className="border-b">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{payment.phone}</td>
                    <td className="py-2 px-4">{payment.referenceId}</td>
                    <td className="py-2 px-4">{payment.amount}</td>
                    <td className="py-2 px-4">{payment.currency}</td>
                    <td
                      className={`py-2 px-4 font-semibold ${
                        payment.status === "SUCCESS"
                          ? "text-green-600"
                          : payment.status === "FAILED"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {payment.status}
                    </td>
                    <td className="py-2 px-4">{payment.reason}</td>
                    <td className="py-2 px-4">{payment.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MtntransactionUI;
