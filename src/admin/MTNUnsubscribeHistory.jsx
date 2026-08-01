import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";

export default function MTNUnsubscribeHistory() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(
        apiUrl("/mtn/payment/mtn-unsubscribe")
      );

      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching unsubscribe data:", error);
    }
  };

  // ✅ EXPORT CSV WITH UPDATED AT
  const exportToCSV = () => {
    const headers = [
      "Phone",
      "Operation",
      "Result Message",
      "Created At",
      "Updated At"
    ];

    const rows = data.map((item) => [
      item.phone,
      item.rawResponse?.operationId || "ACI",
      item.rawResponse?.result || "-",
      new Date(item.createdAt).toLocaleString(),
      new Date(item.updatedAt).toLocaleString()
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "MTN_Unsubscribe_History.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      {/* 🔥 Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          🚫 MTN Unsubscribe History
        </h1>

        <button
          onClick={exportToCSV}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-semibold"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="bg-[#1a001f] rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-900">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Operation</th>
              <th className="p-3">Result</th>
              <th className="p-3">Created At</th>
              <th className="p-3">Updated At</th> {/* ✅ NEW */}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr key={item._id} className="border-b border-gray-700">
                <td className="p-3">{index + 1}</td>

                <td className="p-3">{item.phone}</td>

                <td className="p-3">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    {item.rawResponse?.operationId || "ACI"}
                  </span>
                </td>

                <td className="p-3 text-red-400 font-medium">
                  {item.rawResponse?.result || "-"}
                </td>

                <td className="p-3">
                  {new Date(item.createdAt).toLocaleString()}
                </td>

                {/* ✅ Updated At Column */}
                <td className="p-3">
                  {new Date(item.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center text-gray-400 p-6">
            No Unsubscribe Records Found
          </div>
        )}
      </div>
    </div>
  );
}