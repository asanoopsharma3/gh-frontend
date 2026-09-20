import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import "./DashboardPage.css";
import { getDailySubscriptionApi } from "./adminApi";
import { toGhs } from "./buildDailyReport";
import {
  EARLIEST_DATE,
  clampRangeFromStart,
  ghanaDateValue,
  ghanaMonthStart,
  maxToFromFrom,
} from "./dateRange";

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

const formatGhs = (value) => `GHC ${Number(value || 0).toFixed(2)}`;
const rowPrice = (row) => Number(row?.priceGhs ?? row?.chargingAmount ?? 1) || 1;

const exportCsv = (days) => {
  const headers = ["Date", "MSISDN", "Plan", "Offer Code", "Price (GHS)", "Status", "Created At"];
  const csvRows = days.flatMap((day) =>
    (day.subscriptions || []).map((row) => [
      day.date,
      row.msisdn,
      row.planName || "Daily Subscription",
      row.offerCode,
      Number(rowPrice(row)).toFixed(2),
      row.status || row.type || "new",
      formatDateTime(row.createdAt),
    ])
  );
  const escapeValue = (value) => `"${String(value ?? "-").replace(/"/g, '""')}"`;
  const csv = [headers, ...csvRows].map((row) => row.map(escapeValue).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `daily-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

export default function DailySubscriptionsPage() {
  const navigate = useNavigate();
  const today = ghanaDateValue();
  const monthStart = ghanaMonthStart();
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [appliedFromDate, setAppliedFromDate] = useState(monthStart);
  const [appliedToDate, setAppliedToDate] = useState(today);
  const [report, setReport] = useState(null);
  const [openDate, setOpenDate] = useState("");
  const [detailPage, setDetailPage] = useState(1);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchReport = useCallback(async () => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const res = await getDailySubscriptionApi({
        headers,
        params: {
          from: appliedFromDate,
          to: appliedToDate,
          fromDate: appliedFromDate,
          toDate: appliedToDate,
        },
      });
      setReport(res.data);
      setOpenDate("");
      setDetailPage(1);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/admin/login");
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Unable to load daily subscriptions",
        text: "Selected date range ke subscriber count load nahi ho paye.",
      });
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, appliedToDate, headers, navigate, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleApplyFilter = () => {
    const range = clampRangeFromStart(fromDate || today, toDate || fromDate || today);
    setFromDate(range.from);
    setToDate(range.to);
    setAppliedFromDate(range.from);
    setAppliedToDate(range.to);
  };

  const summary = report?.summary || {};
  const daily = report?.daily || [];
  const daysWithSubs = daily.filter((day) => Number(day.newSubscriptions || 0) > 0);
  const openDay = daily.find((day) => day.date === openDate) || null;
  const detailRows = openDay?.subscriptions || [];
  const detailTotal = detailRows.length;
  const detailTotalPages = Math.max(1, Math.ceil(detailTotal / detailRowsPerPage) || 1);
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const detailStart = (safeDetailPage - 1) * detailRowsPerPage;
  const pagedDetailRows = detailRows.slice(detailStart, detailStart + detailRowsPerPage);
  const totalRows = daysWithSubs.reduce((sum, day) => sum + Number(day.newSubscriptions || 0), 0);
  const totalPrize = Number(
    daysWithSubs.reduce((sum, day) => sum + Number(day.revenueGhs || 0), 0).toFixed(2)
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-page-head">
          <h1 className="dashboard-title">Daily Subscriptions</h1>
          <p>
            Date-wise new daily subscribers. Count pe click karke us din ke MSISDN records kholo.
            Price GHC 1.00 per successful daily subscribe.
          </p>
        </div>

        <section className="dashboard-card-grid dashboard-card-grid-3">
          <article className="dashboard-summary-card">
            <div>
              <h2>Total Subscribers</h2>
              <strong>{summary.newSubscriptions || totalRows || 0}</strong>
              <p>{appliedFromDate} to {appliedToDate}</p>
            </div>
          </article>
          <article className="dashboard-summary-card">
            <div>
              <h2>Total Prize</h2>
              <strong>{formatGhs(summary.newRevenueGhs || totalPrize)}</strong>
              <p>GHC 1.00 × subscriber count</p>
            </div>
          </article>
          <article className="dashboard-summary-card">
            <div>
              <h2>Days</h2>
              <strong>{daysWithSubs.length}</strong>
              <p>Days with at least one subscribe</p>
            </div>
          </article>
        </section>

        <section className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div>
              <h2>Per Day Count</h2>
              <p>
                {appliedFromDate} to {appliedToDate} · {totalRows} subscribers · {formatGhs(totalPrize)}
              </p>
            </div>
            <div className="dashboard-actions dashboard-actions-daily">
              <button className="dashboard-primary dashboard-action-button" onClick={() => exportCsv(daysWithSubs)} type="button">
                <Download size={16} /> Export CSV
              </button>
              <button className="dashboard-muted dashboard-action-button" onClick={fetchReport} type="button">
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
                    setToDate(clampRangeFromStart(nextFrom, toDate).to);
                  }}
                />
              </label>
              <label className="dashboard-field">
                <span>TO</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || EARLIEST_DATE}
                  max={maxToFromFrom(fromDate || today)}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
              <button className="dashboard-filter-button dashboard-action-button" type="button" onClick={handleApplyFilter}>
                Apply Filter
              </button>
            </div>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subscribers</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((day) => (
                  <tr key={day.date} className={openDate === day.date ? "dashboard-row-open" : ""}>
                    <td>{day.date}</td>
                    <td>
                      {day.newSubscriptions ? (
                        <button
                          type="button"
                          className="dashboard-count-link"
                          onClick={() => {
                            setOpenDate((current) => (current === day.date ? "" : day.date));
                            setDetailPage(1);
                          }}
                        >
                          {day.newSubscriptions}
                        </button>
                      ) : (
                        0
                      )}
                    </td>
                    <td>{formatGhs(day.revenueGhs)}</td>
                  </tr>
                ))}
                {!loading && daily.length === 0 && (
                  <tr>
                    <td className="dashboard-empty" colSpan="3">
                      No daily subscriber counts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {openDay && (
          <section className="dashboard-table-card">
            <div className="dashboard-table-header">
              <div>
                <h2>{openDay.date} subscribers</h2>
                <p>
                  {openDay.newSubscriptions} records · {formatGhs(openDay.revenueGhs)}
                </p>
              </div>
              <button
                className="dashboard-muted dashboard-action-button"
                type="button"
                onClick={() => {
                  setOpenDate("");
                  setDetailPage(1);
                }}
              >
                <ChevronLeft size={16} /> Back to counts
              </button>
            </div>
            <div className="dashboard-table-scroll">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>MSISDN</th>
                    <th>Plan</th>
                    <th>Offer Code</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedDetailRows.map((row, index) => (
                    <tr key={`${openDay.date}-${row.msisdn}-${row.createdAt || index}`}>
                      <td>{row.msisdn || "-"}</td>
                      <td>{row.planName || "Daily Subscription"}</td>
                      <td>{row.offerCode || "-"}</td>
                      <td>{formatGhs(rowPrice(row))}</td>
                      <td>
                        <span className="dashboard-status dashboard-status-success">
                          {row.type || row.status || "new"}
                        </span>
                      </td>
                      <td>{formatDateTime(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dashboard-table-footer">
              <label>
                Rows per page
                <select
                  value={detailRowsPerPage}
                  onChange={(e) => {
                    setDetailRowsPerPage(Number(e.target.value));
                    setDetailPage(1);
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
                  {detailTotal
                    ? `${detailStart + 1}-${Math.min(detailStart + pagedDetailRows.length, detailTotal)} of ${detailTotal}`
                    : "0 records"}
                </span>
                <button
                  type="button"
                  disabled={safeDetailPage === 1}
                  onClick={() => setDetailPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <button type="button" className="dashboard-page-active">{safeDetailPage}</button>
                <button
                  type="button"
                  disabled={safeDetailPage === detailTotalPages}
                  onClick={() => setDetailPage((page) => Math.min(detailTotalPages, page + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
