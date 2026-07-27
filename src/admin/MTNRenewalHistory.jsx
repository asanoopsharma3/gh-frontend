import React, { useEffect, useState } from "react";
import axios from "axios";

export default function MTNRenewalHistory() {
  const [renewals, setRenewals] = useState([]);
  const [countByPhone, setCountByPhone] = useState({});

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      const res = await axios.get(
        "https://ghsuperwinnings.com/api/mtn/payment/mtn-renewals"
      );

      const data = res.data.data;
      setRenewals(data);

      const counts = data.reduce((acc, item) => {
        acc[item.phone] = (acc[item.phone] || 0) + 1;
        return acc;
      }, {});

      setCountByPhone(counts);
    } catch (error) {
      console.error("Error fetching renewals:", error);
    }
  };

  // 🔥 EXPORT CSV FUNCTION
  const exportToCSV = () => {
    const headers = [
      "Phone",
      "Plan",
      "Amount",
      "Operation",
      "Count",
      "Status",
      "Created At",
      "Updated At"
    ];

    const rows = renewals.map((item) => {
      const plan =
        item.rawResponse?.appliedPlan ||
        item.rawResponse?.requestedPlan ||
        "-";

      return [
        item.phone,
        plan,
        item.rawResponse?.chargeAmount || "0",
        item.rawResponse?.operationId || "-",
        countByPhone[item.phone] || 0,
        item.status,
        new Date(item.createdAt).toLocaleString(),
        new Date(item.updatedAt).toLocaleString()
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MTN_Renewal_History.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      {/* 🔥 Header with Export Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          🔁 MTN Renewal History
        </h1>

        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="bg-[#1a001f] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-purple-900">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Operation</th>
              <th className="p-3">Count</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created At</th>
              <th className="p-3">Updated At</th>
            </tr>
          </thead>

          <tbody>
            {renewals.map((item, index) => {
              const plan =
                item.rawResponse?.appliedPlan ||
                item.rawResponse?.requestedPlan ||
                "-";

              return (
                <tr key={item._id} className="border-b border-gray-700">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{item.phone}</td>
                  <td className="p-3 text-purple-300">{plan}</td>
                  <td className="p-3">
                    {item.rawResponse?.chargeAmount || "0"} SZL
                  </td>
                  <td className="p-3">
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-semibold">
                      {item.rawResponse?.operationId || "-"}
                    </span>
                  </td>
                  <td className="p-3 text-blue-400 font-bold">
                    {countByPhone[item.phone] || 0}
                  </td>
                  <td className="p-3 text-green-400 font-semibold">
                    {item.status}
                  </td>
                  <td className="p-3">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {renewals.length === 0 && (
          <div className="text-center text-gray-400 p-6">
            No Renewal Records Found
          </div>
        )}
      </div>
    </div>
  );
}