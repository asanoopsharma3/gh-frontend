import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";
import "./DashboardPage.css";
import { ADMIN_API_BASE } from "../config/api";

const API_BASE_URLS = [ADMIN_API_BASE];

const reportTabs = [
  { key: "all", label: "All Status" },
  { key: "success", label: "Success" },
  { key: "renewal", label: "Renewal" },
  { key: "churn", label: "Churn" },
  { key: "failed", label: "Failed" },
];

const pageMeta = {
  all: {
    title: "Dashboard",
    tableTitle: "All Subscriber",
    description: "Complete subscription and callback activity.",
  },
  success: {
    title: "Subscribers",
    tableTitle: "Subscribers",
    description: "Successful subscription records with MSISDN and offer details.",
  },
  renewal: {
    title: "Renewal Subscribers",
    tableTitle: "Renewal Subscribers",
    description: "Renewal callback records and billing lifecycle data.",
  },
  churn: {
    title: "Churn Subscribers",
    tableTitle: "Churn Subscribers",
    description: "Churn, low balance and inactive subscription records.",
  },
  failed: {
    title: "Failed Callbacks",
    tableTitle: "Failed Callbacks",
    description: "Failed callback records and failure reasons.",
  },
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (["success", "active", "renewal"].includes(value)) return "dashboard-status-success";
  if (["failed", "inactive"].includes(value)) return "dashboard-status-failed";
  if (["churn", "suspended", "insufficient"].includes(value)) return "dashboard-status-warning";
  return "dashboard-status-default";
};

const exportCsv = (rows) => {
  const headers = ["MSISDN", "Offer Code", "Reason", "Lifecycle", "Status", "Charging Amount", "Created At"];
  const csvRows = rows.map((row) => [
    row.msisdn,
    row.offerCode,
    row.reason,
    row.lifecycle,
    row.status || row.rawStatus,
    row.chargingAmount,
    formatDateTime(row.createdAt),
  ]);
  const escapeValue = (value) => `"${String(value ?? "-").replace(/"/g, '""')}"`;
  const csv = [headers, ...csvRows].map((row) => row.map(escapeValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `admin-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

const getAdminData = async (path, config) => {
  let lastError;
  for (const baseUrl of API_BASE_URLS) {
    try {
      return await axios.get(`${baseUrl}${path}`, config);
    } catch (error) {
      lastError = error;
      if (![404, 405].includes(error.response?.status)) throw error;
    }
  }
  throw lastError;
};

export default function DashboardPage({ defaultReport = "all" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [report, setReport] = useState(defaultReport);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchDashboard = useCallback(async () => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (appliedFromDate) params.date = appliedFromDate;
      if (report !== "all") params.report = report;
      const res = await getAdminData("/dashboard", { headers, params });
      if (res.data.success) {
        setRows(res.data.data || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load dashboard data";
      Swal.fire("Dashboard Error", message, "error");
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, headers, navigate, report, token]);

  useEffect(() => {
    setReport(defaultReport);
    setCurrentPage(1);
  }, [defaultReport]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const filteredRows = useMemo(() => {
    const from = appliedFromDate ? new Date(`${appliedFromDate}T00:00:00`) : null;
    const to = appliedToDate ? new Date(`${appliedToDate}T23:59:59`) : null;

    return rows.filter((row) => {
      const created = row.createdAt ? new Date(row.createdAt) : null;
      const dateMatch = (!from || !created || created >= from) && (!to || !created || created <= to);
      return dateMatch;
    });
  }, [rows, appliedFromDate, appliedToDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFromDate, appliedToDate, report, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(pageStart, pageStart + rowsPerPage);
  const isDashboard = defaultReport === "all";
  const activeMeta = pageMeta[defaultReport] || pageMeta.all;

  const cards = [
    {
      label: "Monthly Subscriber",
      value: summary.totalSubscribers || 0,
    },
    {
      label: "Today Subscriber",
      value: summary.success || 0,
    },
    {
      label: "Today Renewal",
      value: summary.renewals || 0,
    },
    {
      label: "Monthly GHCAmount",
      value: `GHC${Number(summary.totalGhsAmount || 0).toFixed(2)}`,
    },
  ];

  const handleExport = () => {
    if (!filteredRows.length) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "There are no records available to export.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }
    exportCsv(filteredRows);
    Swal.fire({
      icon: "success",
      title: "Export Started",
      text: `${filteredRows.length} records are being exported.`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleApplyFilter = () => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "From date cannot be greater than To date.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    if (!fromDate && !toDate && report === defaultReport) {
      Swal.fire({
        icon: "info",
        title: "No Filter Selected",
        text: "Please select a date or status before applying the filter.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    Swal.fire({
      icon: "success",
      title: "Filter Applied",
      text: "Dashboard data has been filtered successfully.",
      timer: 1400,
      showConfirmButton: false,
    });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {!isDashboard && (
          <div className="dashboard-page-head">
            <h1 className="dashboard-title">{activeMeta.title}</h1>
          </div>
        )}

        {isDashboard && <section className="dashboard-card-grid">
          {cards.map(({ label, value }) => (
            <article className="dashboard-summary-card" key={label}>
              <div>
                <h2>{label}</h2>
                <strong>{value}</strong>
                <p><span>Up 0%</span> vs. last week</p>
              </div>
            </article>
          ))}
        </section>}

        <section className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div>
              <h2>{activeMeta.tableTitle}</h2>
              <p>{filteredRows.length} records found</p>
            </div>

            <div className="dashboard-actions">
              <button className="dashboard-primary dashboard-action-button" onClick={handleExport}>
                <Download size={16} /> Export CSV
              </button>
              <button className="dashboard-muted dashboard-action-button" onClick={fetchDashboard}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <label className="dashboard-field">
                <span>FROM</span>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </label>
              <label className="dashboard-field">
                <span>TO</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </label>
              {isDashboard && <label className="dashboard-field">
                <span>STATUS</span>
                <select value={report} onChange={(e) => setReport(e.target.value)}>
                  {reportTabs.map((tab) => (
                    <option key={tab.key} value={tab.key}>{tab.label}</option>
                  ))}
                </select>
              </label>}
              <button className="dashboard-filter-button dashboard-action-button" type="button" onClick={handleApplyFilter}>
                Apply Filter
              </button>
            </div>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>MSISDN</th>
                  <th>Offer Code</th>
                  <th>Reason</th>
                  <th>Lifecycle</th>
                  <th>Next Billing Date</th>
                  <th>Status</th>
                  <th>Charging Amount</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => (
                  <tr key={`${row.source}-${row.id}`}>
                    <td>{row.msisdn || "-"}</td>
                    <td>{row.offerCode || "-"}</td>
                    <td>{row.reason || "-"}</td>
                    <td>{row.lifecycle || "-"}</td>
                    <td>{formatDateTime(row.nextBillingDate)}</td>
                    <td>
                      <span className={`dashboard-status ${statusClass(row.status || row.rawStatus)}`}>
                        {row.status || row.rawStatus || "Unknown"}
                      </span>
                    </td>
                    <td>GHC{Number(row.chargingAmount || 0).toFixed(2)}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
                {!loading && paginatedRows.length === 0 && (
                  <tr>
                    <td className="dashboard-empty" colSpan="8">No subscriber records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dashboard-table-footer">
            <label>
              Rows per page
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <div className="dashboard-pagination">
              <span>
                {filteredRows.length
                  ? `${pageStart + 1}-${Math.min(pageStart + rowsPerPage, filteredRows.length)} of ${filteredRows.length}`
                  : "0 records"}
              </span>
              <button disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                <ChevronLeft size={16} />
              </button>
              <button className="dashboard-page-active">{safePage}</button>
              <button disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
