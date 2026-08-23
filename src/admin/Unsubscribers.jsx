import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import "./DashboardPage.css";
import { ADMIN_API_BASE } from "../config/api";

const API_BASE_URLS = [ADMIN_API_BASE];

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

export default function Unsubscribers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [historyPage, setHistoryPage] = useState(1);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchUnsubscribers = useCallback(async () => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    setLoading(true);
    try {
      const res = await getAdminData("/unsubscribers", { headers });
      if (res.data.success) {
        setUsers(res.data.users || []);
        setHistory(res.data.history || []);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      const message = err.response?.data?.message || "Unable to load unsubscribe details";
      Swal.fire({
        icon: "error",
        title: "Unsubscribers Load Failed",
        text: message,
        confirmButtonColor: "#1683f5",
      });
      if (err.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [headers, navigate, token]);

  useEffect(() => {
    fetchUnsubscribers();
  }, [fetchUnsubscribers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [
        user.msisdn,
        user.subscriptionStatus,
        user.unsubscribed ? "yes unsubscribed" : "no active",
        user.sessionFlushed ? "session flushed" : "session active",
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [search, users]);

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) =>
          [item.msisdn, item.source, item.result, item.description, item.status].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [history, search]);

  useEffect(() => {
    setCurrentPage(1);
    setHistoryPage(1);
  }, [search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + rowsPerPage);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / rowsPerPage));
  const safeHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyStart = (safeHistoryPage - 1) * rowsPerPage;
  const paginatedHistory = filteredHistory.slice(historyStart, historyStart + rowsPerPage);

  const cards = [
    { label: "Currently Unsubscribed", value: summary.currentlyUnsubscribed || 0 },
    { label: "Today Unsubscribe", value: summary.today || 0 },
    { label: "Unsubscribe Events", value: summary.historyCount || 0 },
  ];

  const exportToExcel = () => {
    if (!filteredUsers.length && !filteredHistory.length) {
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: "There are no unsubscribe records to export.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        filteredUsers.map((user, index) => ({
          "S.No": index + 1,
          MSISDN: user.msisdn,
          "Unsubscribed?": user.unsubscribed ? "Yes" : "No (resubscribed)",
          "Subscription Status": user.subscriptionStatus,
          "MTN Status": user.mtnStatus || "-",
          "MTN Description": user.mtnDescription || "-",
          "Status Code": user.mtnStatusCode ?? "-",
          "Unsubscribed At": formatDateTime(user.unsubscribedAt),
          "Session Flushed": user.sessionFlushed ? "Yes" : "No",
          "Updated At": formatDateTime(user.updatedAt),
        }))
      ),
      "Unsubscribed Users"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        filteredHistory.map((item, index) => ({
          "S.No": index + 1,
          MSISDN: item.msisdn,
          Source: item.source,
          Status: item.result,
          Description: item.description,
          "Status Code": item.statusCode ?? "-",
          "Created At": formatDateTime(item.createdAt),
        }))
      ),
      "Unsubscribe History"
    );
    XLSX.writeFile(workbook, `unsubscribers-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-page-head">
          <h1 className="dashboard-title">Unsubscribers</h1>
          <p>See which numbers unsubscribed from the website and whether their login session was flushed.</p>
        </div>

        <section className="dashboard-card-grid">
          {cards.map(({ label, value }) => (
            <article className="dashboard-summary-card" key={label}>
              <div>
                <h2>{label}</h2>
                <strong>{value}</strong>
                <p>Website unsubscribe records</p>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div>
              <h2>Unsubscribed Numbers</h2>
              <p>{filteredUsers.length} records found</p>
            </div>
            <div className="dashboard-actions">
              <button className="dashboard-primary dashboard-action-button" type="button" onClick={exportToExcel}>
                <Download size={16} /> Export Excel
              </button>
              <button className="dashboard-muted dashboard-action-button" type="button" onClick={fetchUnsubscribers}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <label className="dashboard-field">
                <span>SEARCH</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search MSISDN"
                />
              </label>
            </div>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>MSISDN</th>
                  <th>Unsubscribed?</th>
                  <th>MTN Status</th>
                  <th>Description</th>
                  <th>Session Flushed</th>
                  <th>Unsubscribed At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="dashboard-empty">Loading unsubscribe details...</td>
                  </tr>
                ) : paginatedUsers.length ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.msisdn || "-"}</td>
                      <td>
                        <span className={`dashboard-status ${user.unsubscribed ? "dashboard-status-failed" : "dashboard-status-success"}`}>
                          {user.unsubscribed ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <span className={`dashboard-status ${/success/i.test(user.mtnStatus || "") ? "dashboard-status-success" : "dashboard-status-failed"}`}>
                          {user.mtnStatus || user.subscriptionStatus || "-"}
                        </span>
                      </td>
                      <td>{user.mtnDescription || "-"}</td>
                      <td>
                        <span className={`dashboard-status ${user.sessionFlushed ? "dashboard-status-warning" : "dashboard-status-default"}`}>
                          {user.sessionFlushed ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>{formatDateTime(user.unsubscribedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="dashboard-empty" colSpan="6">No unsubscribe records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dashboard-table-footer">
            <label>
              Rows per page
              <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
            <div className="dashboard-pagination">
              <span>
                {filteredUsers.length
                  ? `${pageStart + 1}-${Math.min(pageStart + rowsPerPage, filteredUsers.length)} of ${filteredUsers.length}`
                  : "0 records"}
              </span>
              <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
                <ChevronLeft size={16} />
              </button>
              <button className="dashboard-page-active" type="button">{safePage}</button>
              <button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-table-card" style={{ marginTop: 24 }}>
          <div className="dashboard-table-header">
            <div>
              <h2>Unsubscribe Event History</h2>
              <p>{filteredHistory.length} events logged</p>
            </div>
          </div>
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>MSISDN</th>
                  <th>Source</th>
                  <th>MTN Status</th>
                  <th>Description</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length ? (
                  paginatedHistory.map((item) => (
                    <tr key={`${item.source}-${item.id}`}>
                      <td>{item.msisdn || "-"}</td>
                      <td>{item.source || "-"}</td>
                      <td>
                        <span className="dashboard-status dashboard-status-failed">
                          {item.result || item.status || "unsubscribed"}
                        </span>
                      </td>
                      <td>{item.description || "-"}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="dashboard-empty" colSpan="5">No unsubscribe events logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="dashboard-table-footer">
            <span />
            <div className="dashboard-pagination">
              <span>
                {filteredHistory.length
                  ? `${historyStart + 1}-${Math.min(historyStart + rowsPerPage, filteredHistory.length)} of ${filteredHistory.length}`
                  : "0 records"}
              </span>
              <button type="button" disabled={safeHistoryPage === 1} onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}>
                <ChevronLeft size={16} />
              </button>
              <button className="dashboard-page-active" type="button">{safeHistoryPage}</button>
              <button type="button" disabled={safeHistoryPage === historyTotalPages} onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
