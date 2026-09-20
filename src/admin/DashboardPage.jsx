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
import { getAdminApi } from "./adminApi";
import { toGhs } from "./buildDailyReport";
import {
  EARLIEST_DATE,
  clampRangeFromStart,
  ghanaDateValue,
  ghanaMonthStart,
  maxToFromFrom,
} from "./dateRange";

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
    timeZone: "Africa/Accra",
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

const getAdminData = async (path, config) => getAdminApi(path, config);

const normalizeText = (value) => String(value || "").toLowerCase();

const matchesReport = (row, reportKey) => {
  if (!reportKey || reportKey === "all") return true;

  const status = normalizeText(row.status || row.rawStatus);
  const lifecycle = normalizeText(row.lifecycle);
  const reason = normalizeText(row.reason);
  const source = normalizeText(row.source);
  const blob = `${status} ${lifecycle} ${reason} ${source}`;

  if (reportKey === "success") {
    return (
      ["success", "successful", "active", "subscribed", "a", "200", "0", "00"].includes(status) ||
      ["activation", "first", "new", "subscribe", "sub"].some((key) => lifecycle === key || lifecycle.startsWith(`${key}`)) ||
      source.includes("sdp") ||
      source.includes("user")
    ) && !["fail", "churn", "renew", "unsub"].some((key) => blob.includes(key));
  }

  if (reportKey === "renewal") {
    return blob.includes("renew");
  }

  if (reportKey === "churn") {
    return ["churn", "inactive", "unsubscribed", "unsubscribe", "suspended", "insufficient"].some(
      (key) => blob.includes(key)
    );
  }

  if (reportKey === "failed") {
    return blob.includes("fail");
  }

  return true;
};

const matchesDateRange = (row, fromDate, toDate) => {
  if (!fromDate && !toDate) return true;
  const stamp = row.createdAt || row.callbackTimestamp || row.updatedAt;
  if (!stamp) return false;
  const ghana = new Date(stamp).toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ghana)) return false;
  if (fromDate && ghana < fromDate) return false;
  if (toDate && ghana > toDate) return false;
  return true;
};

const createdTime = (row) => {
  const date = new Date(row?.createdAt || row?.updatedAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sortNewestFirst = (list) =>
  [...list].sort((a, b) => createdTime(b) - createdTime(a));

const getRowAmount = (row) => {
  const candidates = [
    row?.chargingAmount,
    row?.chargeAmount,
    row?.amount,
    row?.ghsAmount,
    row?.charging_amount,
    row?.mtn?.chargingAmount,
    row?.payload?.chargingAmount,
  ];
  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount) && amount !== 0) return amount;
  }
  const fallback = Number(candidates.find((value) => value != null) ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const mapApiSummary = (raw = {}) => ({
  totalSubscribers: Number(
    raw.totalSubscribers ??
      raw.monthlySubscribers ??
      raw.monthlySubscriber ??
      raw.subscribers ??
      0
  ),
  success: Number(
    raw.success ??
      raw.todaySubscribers ??
      raw.todaySubscriber ??
      raw.todaySuccess ??
      0
  ),
  renewals: Number(
    raw.renewals ?? raw.todayRenewals ?? raw.todayRenewal ?? raw.renewal ?? 0
  ),
  totalGhsAmount: Number(
    raw.totalGhsAmount ??
      raw.monthlyGhsAmount ??
      raw.monthlyAmount ??
      raw.ghsAmount ??
      raw.totalAmount ??
      0
  ),
});

const computeDashboardSummary = (list) => {
  const todayStart = startOfToday();
  const monthStart = startOfMonth();
  const now = new Date();
  const monthlyMsisdn = new Set();
  const todayMsisdn = new Set();
  let todayRenewals = 0;
  let monthlyGhs = 0;

  for (const row of list) {
    const created = new Date(row?.createdAt || row?.updatedAt);
    if (Number.isNaN(created.getTime())) continue;

    const amount = getRowAmount(row);
    const isRenewal = matchesReport(row, "renewal");
    const isFailed = matchesReport(row, "failed");
    const isChurn = matchesReport(row, "churn");
    const isSuccess =
      matchesReport(row, "success") ||
      (!isRenewal && !isFailed && !isChurn && Boolean(row.msisdn));

    if (created >= monthStart && created <= now) {
      if ((isSuccess || isRenewal) && !isFailed) {
        monthlyGhs += amount;
      }
      if (isSuccess && !isRenewal && row.msisdn) {
        monthlyMsisdn.add(String(row.msisdn));
      }
    }

    if (created >= todayStart && created <= now) {
      if (isRenewal) todayRenewals += 1;
      if (isSuccess && !isRenewal && row.msisdn) {
        todayMsisdn.add(String(row.msisdn));
      }
    }
  }

  return {
    totalSubscribers: monthlyMsisdn.size,
    success: todayMsisdn.size,
    renewals: todayRenewals,
    totalGhsAmount: monthlyGhs,
  };
};

export default function DashboardPage({ defaultReport = "all" }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [fromDate, setFromDate] = useState(ghanaMonthStart());
  const [toDate, setToDate] = useState(ghanaDateValue());
  const [appliedFromDate, setAppliedFromDate] = useState(ghanaMonthStart());
  const [appliedToDate, setAppliedToDate] = useState(ghanaDateValue());
  const [report, setReport] = useState(defaultReport);
  const [appliedReport, setAppliedReport] = useState(defaultReport);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [serverPaginated, setServerPaginated] = useState(false);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchDashboard = useCallback(async (signal) => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: rowsPerPage,
        report: appliedReport,
        sort: "desc",
        sortBy: "createdAt",
      };
      const range = clampRangeFromStart(appliedFromDate, appliedToDate);
      params.fromDate = range.from;
      params.toDate = range.to;

      const res = await getAdminData("/dashboard", { headers, params, signal });
      const payload = res.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      const total = Number(
        payload.total ??
          payload.count ??
          payload.pagination?.total ??
          payload.meta?.total
      );

      setRows(sortNewestFirst(list));
      if (Number.isFinite(total) && total >= 0) {
        setServerPaginated(true);
        setTotalRecords(total);
      } else {
        setServerPaginated(false);
        setTotalRecords(list.length);
      }
    } catch (err) {
      if (axios.isCancel?.(err) || err.code === "ERR_CANCELED" || err.name === "CanceledError") {
        return;
      }
      const message = err.response?.data?.message || "Unable to load dashboard data";
      Swal.fire("Dashboard Error", message, "error");
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [
    appliedFromDate,
    appliedReport,
    appliedToDate,
    currentPage,
    headers,
    navigate,
    rowsPerPage,
    token,
  ]);

  const fetchSummary = useCallback(async (signal) => {
    if (!token || defaultReport !== "all") return;

    try {
      const params = {
        page: 1,
        limit: 50,
        report: "all",
        sort: "desc",
        sortBy: "createdAt",
      };
      const range = clampRangeFromStart(appliedFromDate, appliedToDate);
      params.fromDate = range.from;
      params.toDate = range.to;
      const res = await getAdminData("/dashboard", {
        headers,
        signal,
        params,
      });
      const payload = res.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      const apiSummary = payload.summary || {};
      const computed = computeDashboardSummary(list);
      const mapped = mapApiSummary(apiSummary);
      const hasApiSummary = Boolean(payload.summary);
      setSummary({
        totalSubscribers: hasApiSummary ? mapped.totalSubscribers : computed.totalSubscribers,
        success: hasApiSummary ? mapped.success : computed.success,
        renewals: hasApiSummary ? mapped.renewals : computed.renewals,
        totalGhsAmount: hasApiSummary ? mapped.totalGhsAmount : computed.totalGhsAmount,
      });
    } catch (err) {
      if (axios.isCancel?.(err) || err.code === "ERR_CANCELED" || err.name === "CanceledError") {
        return;
      }
    }
  }, [appliedFromDate, appliedToDate, defaultReport, headers, token]);

  useEffect(() => {
    setReport(defaultReport);
    setAppliedReport(defaultReport);
    setCurrentPage(1);
    setFromDate(ghanaMonthStart());
    setToDate(ghanaDateValue());
    setAppliedFromDate(ghanaMonthStart());
    setAppliedToDate(ghanaDateValue());
  }, [defaultReport]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDashboard(controller.signal);
    return () => controller.abort();
  }, [fetchDashboard]);

  useEffect(() => {
    if (defaultReport !== "all") return undefined;
    const controller = new AbortController();
    fetchSummary(controller.signal);
    return () => controller.abort();
  }, [defaultReport, fetchSummary]);

  const filteredRows = useMemo(() => {
    return sortNewestFirst(
      rows.filter(
        (row) =>
          matchesReport(row, appliedReport) &&
          matchesDateRange(row, appliedFromDate, appliedToDate)
      )
    );
  }, [appliedFromDate, appliedReport, appliedToDate, rows]);

  const displayRows = serverPaginated ? rows : filteredRows;
  const recordCount = serverPaginated ? totalRecords : filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(recordCount / rowsPerPage) || 1);
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const paginatedRows = serverPaginated
    ? displayRows
    : displayRows.slice(pageStart, pageStart + rowsPerPage);
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

  const handleExport = async () => {
    try {
      const params = {
        page: 1,
        limit: 500,
        report: appliedReport,
        sort: "desc",
        sortBy: "createdAt",
      };
      const range = clampRangeFromStart(appliedFromDate, appliedToDate);
      params.fromDate = range.from;
      params.toDate = range.to;

      const res = await getAdminData("/dashboard", { headers, params });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      const exportRows = sortNewestFirst(list);

      if (!exportRows.length) {
        Swal.fire({
          icon: "info",
          title: "No Data Found",
          text: "There are no records available to export.",
          confirmButtonColor: "#1683f5",
        });
        return;
      }
      exportCsv(exportRows);
      Swal.fire({
        icon: "success",
        title: "Export Started",
        text: `${exportRows.length} records are being exported.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Export Error", err.response?.data?.message || "Unable to export records.", "error");
    }
  };

  const handleApplyFilter = () => {
    if (fromDate && toDate && fromDate > toDate) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "From date cannot be greater than To date.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    const range = clampRangeFromStart(fromDate, toDate);
    setFromDate(range.from);
    setToDate(range.to);
    setAppliedFromDate(range.from);
    setAppliedToDate(range.to);
    setAppliedReport(isDashboard ? report : defaultReport);
    setCurrentPage(1);
    Swal.fire({
      icon: range.clamped ? "warning" : "success",
      title: range.clamped ? "Range Limited To 31 Days" : "Filter Applied",
      text: range.clamped
        ? `From ${range.from}, To can go up to ${range.maxTo} (31 days). Showing ${range.from} to ${range.to}.`
        : "Subscriber data has been filtered for the selected dates.",
      timer: range.clamped ? 2400 : 1400,
      showConfirmButton: false,
      confirmButtonColor: "#1683f5",
    });
  };

  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [currentPage, safePage]);

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
              <p>
                {recordCount} records found · {appliedFromDate} to {appliedToDate} (any month, max 31 days)
              </p>
            </div>

            <div className="dashboard-actions">
              <button className="dashboard-primary dashboard-action-button" onClick={handleExport}>
                <Download size={16} /> Export CSV
              </button>
              <button
                className="dashboard-muted dashboard-action-button"
                onClick={() => {
                  fetchDashboard();
                  fetchSummary();
                }}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <label className="dashboard-field">
                <span>FROM</span>
                <input
                  type="date"
                  value={fromDate}
                  min={EARLIEST_DATE}
                  max={ghanaDateValue()}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    setFromDate(nextFrom);
                    const range = clampRangeFromStart(nextFrom, toDate);
                    setToDate(range.to);
                  }}
                />
              </label>
              <label className="dashboard-field">
                <span>TO</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || EARLIEST_DATE}
                  max={maxToFromFrom(fromDate || ghanaDateValue())}
                  onChange={(e) => setToDate(e.target.value)}
                />
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
                {paginatedRows.map((row, index) => (
                  <tr key={`${row.source || "row"}-${row.id || row._id || row.msisdn || "item"}-${row.createdAt || index}`}>
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
                    <td>GHC{toGhs(row.chargingAmount, 0).toFixed(2)}</td>
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
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <div className="dashboard-pagination">
              <span>
                {recordCount
                  ? `${pageStart + 1}-${Math.min(pageStart + paginatedRows.length, recordCount)} of ${recordCount}`
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
