import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Download, RefreshCw } from "lucide-react";
import "./DashboardPage.css";
import { getDailySubscriptionApi } from "./adminApi";
import { toGhs } from "./buildDailyReport";

const ghanaToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Accra" });

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

const rowPrice = (row) => Number(row?.priceGhs ?? row?.chargingAmount ?? 0);

const exportCsv = (days) => {
  const headers = [
    "Date",
    "MSISDN",
    "Plan",
    "Offer Code",
    "Price (GHS)",
    "Source",
    "Flow",
    "Status",
    "Created At",
  ];
  const csvRows = days.flatMap((day) =>
    (day.subscriptions || []).map((row) => [
      day.date,
      row.msisdn,
      row.planName || "Daily Subscription",
      row.offerCode,
      Number(rowPrice(row)).toFixed(2),
      row.source,
      row.flow,
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
  const today = ghanaToday();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [appliedFromDate, setAppliedFromDate] = useState(today);
  const [appliedToDate, setAppliedToDate] = useState(today);
  const [report, setReport] = useState(null);
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
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/admin/login");
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Unable to load daily subscriptions",
        text:
          (typeof err.response?.data?.message === "string" && err.response.data.message) ||
          err.message ||
          "Dashboard API se daily data load nahi ho paya.",
      });
    } finally {
      setLoading(false);
    }
  }, [appliedFromDate, appliedToDate, headers, navigate, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleApplyFilter = () => {
    const nextFrom = fromDate || today;
    const nextTo = toDate || nextFrom;
    if (nextFrom > nextTo) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Date Range",
        text: "From date cannot be greater than To date.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }
    if (nextFrom === appliedFromDate && nextTo === appliedToDate) {
      fetchReport();
      return;
    }
    setAppliedFromDate(nextFrom);
    setAppliedToDate(nextTo);
  };

  const handleToday = () => {
    setFromDate(today);
    setToDate(today);
    setAppliedFromDate(today);
    setAppliedToDate(today);
  };

  const summary = report?.summary || {};
  const daily = report?.daily || [];
  const isDailyView = report?.view === "daily" || appliedFromDate === appliedToDate;
  const totalRows = daily.reduce((sum, day) => sum + (day.subscriptions?.length || 0), 0);
  const dailyPlan = report?.plans?.find((plan) => plan.billing === "daily") || {
    name: "Daily Subscription",
    amountGhs: 1,
  };
  dailyPlan.amountGhs = toGhs(dailyPlan.amountGhs, 1) || 1;

  const cards = [
    {
      label: isDailyView ? "Today / Selected Day" : "Range Total",
      value: summary.newSubscriptions || 0,
      note: "New daily activations only",
    },
    {
      label: "Unique Users",
      value: summary.uniqueUsers || 0,
      note: "Deduped MSISDNs",
    },
    {
      label: "New Revenue",
      value: formatGhs(summary.newRevenueGhs),
      note: `${dailyPlan.name} · ${formatGhs(dailyPlan.amountGhs)} each`,
    },
    {
      label: "Renewals",
      value: summary.renewals || 0,
      note: "Daily billing, not counted as new",
    },
    {
      label: "Already Subscribed",
      value: summary.alreadySubscribed || 0,
      note: "Repeat consent, not counted as new",
    },
    {
      label: "Top-ups",
      value: summary.topup || 0,
      note: `Extra questions · ${formatGhs(summary.topupRevenueGhs)}`,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-page-head">
          <h1 className="dashboard-title">Daily Subscriptions</h1>
          <p>
            New MTN daily activations only. Renewals, already-subscribed, failed consent,
            churn and top-ups are excluded from this table. Price is {formatGhs(dailyPlan.amountGhs)} per
            successful daily subscribe.
          </p>
        </div>

        <section className="dashboard-card-grid dashboard-card-grid-3">
          {cards.map((card) => (
            <article className="dashboard-summary-card" key={card.label}>
              <div>
                <h2>{card.label}</h2>
                <strong>{card.value}</strong>
                <p>{card.note}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div>
              <h2>{isDailyView ? "New Subscriptions" : "Date-wise New Subscriptions"}</h2>
              <p>
                {appliedFromDate === appliedToDate
                  ? `${appliedFromDate} · ${totalRows} records · ${formatGhs(summary.newRevenueGhs)}`
                  : `${appliedFromDate} to ${appliedToDate} · ${totalRows} records · ${formatGhs(summary.newRevenueGhs)}`}
              </p>
            </div>
            <div className="dashboard-actions dashboard-actions-daily">
              <button
                className="dashboard-primary dashboard-action-button"
                onClick={() => exportCsv(daily)}
                type="button"
              >
                <Download size={16} /> Export CSV
              </button>
              <button
                className="dashboard-muted dashboard-action-button"
                onClick={fetchReport}
                type="button"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <button className="dashboard-muted dashboard-action-button" onClick={handleToday} type="button">
                Today
              </button>
              <label className="dashboard-field">
                <span>FROM</span>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </label>
              <label className="dashboard-field">
                <span>TO</span>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </label>
              <button className="dashboard-filter-button dashboard-action-button" type="button" onClick={handleApplyFilter}>
                Apply Filter
              </button>
            </div>
          </div>

          {daily.map((day) => (
            <div key={day.date}>
              {!isDailyView && (
                <div className="dashboard-table-header">
                  <div>
                    <h2>{day.date}</h2>
                    <p>
                      {day.newSubscriptions} new subscriptions · {formatGhs(day.revenueGhs)}
                    </p>
                  </div>
                </div>
              )}
              <div className="dashboard-table-scroll">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>MSISDN</th>
                      <th>Plan</th>
                      <th>Offer Code</th>
                      <th>Price</th>
                      <th>Source</th>
                      <th>Flow</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(day.subscriptions || []).map((row, index) => (
                      <tr key={`${day.date}-${row.msisdn}-${row.createdAt || index}`}>
                        <td>{row.msisdn || "-"}</td>
                        <td>{row.planName || "Daily Subscription"}</td>
                        <td>{row.offerCode || "-"}</td>
                        <td>{formatGhs(rowPrice(row))}</td>
                        <td>{row.source || "-"}</td>
                        <td>{row.flow || "-"}</td>
                        <td>
                          <span className="dashboard-status dashboard-status-success">
                            {row.type || row.status || "new"}
                          </span>
                        </td>
                        <td>{formatDateTime(row.createdAt)}</td>
                      </tr>
                    ))}
                    {!loading && (day.subscriptions || []).length === 0 && (
                      <tr>
                        <td className="dashboard-empty" colSpan="8">
                          No new daily subscriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
