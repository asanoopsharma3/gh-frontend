import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search } from "lucide-react";
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

export default function FetchAllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminData("/users", { headers });
      if (res.data.success) setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to fetch users";
      setError(message);
      Swal.fire({
        icon: "error",
        title: "Users Load Failed",
        text: message,
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [
        user._id,
        user.phone,
        user.subscriptionStatus,
        user.isPhoneVerified ? "verified" : "not verified",
        user.isAttemptQuiz ? "topup required" : "can play",
      ].some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [users, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + rowsPerPage);

  const exportToExcel = () => {
    if (!filteredUsers.length) {
      Swal.fire({
        icon: "info",
        title: "No Users Found",
        text: "There is no user data available to export.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    const dataToExport = filteredUsers.map((user, index) => ({
      "S.No": index + 1,
      "User ID": user._id,
      Phone: user.phone,
      Subscription: user.subscriptionStatus || "inactive",
      Verified: user.isPhoneVerified ? "Yes" : "No",
      "Quiz Access": user.isAttemptQuiz ? "Top-up Required" : "Can Play",
      "Top-up Count": user.currentSzlAssigned || 0,
      "Questions Used": user.questionsPlayedToday || 0,
      "Created At": formatDateTime(user.createdAt),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "All_Users_List.xlsx");
    Swal.fire({
      icon: "success",
      title: "Export Started",
      text: `${filteredUsers.length} users are being exported.`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-page-head">
          <h1 className="dashboard-title">All Users</h1>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        <section className="dashboard-table-card">
          <div className="dashboard-table-header">
            <div>
              <h2>User Directory</h2>
              <p>{filteredUsers.length} users found</p>
            </div>

            <div className="dashboard-actions">
              <button className="dashboard-primary" type="button" onClick={exportToExcel}>
                <Download size={16} /> Export Excel
              </button>
              <button className="dashboard-muted" type="button" onClick={fetchUsers}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
              <label className="dashboard-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users"
                />
              </label>
            </div>
          </div>

          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Phone</th>
                  <th>Subscription</th>
                  <th>Verified</th>
                  <th>Quiz Access</th>
                  <th>Top-up Count</th>
                  <th>Questions Used</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="dashboard-empty">Loading users...</td></tr>
                ) : paginatedUsers.length ? (
                  paginatedUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user._id}</td>
                      <td>{user.phone || "-"}</td>
                      <td>
                        <span className={`dashboard-status ${user.subscriptionStatus === "active" ? "dashboard-status-success" : "dashboard-status-default"}`}>
                          {user.subscriptionStatus || "inactive"}
                        </span>
                      </td>
                      <td>
                        <span className={`dashboard-status ${user.isPhoneVerified ? "dashboard-status-success" : "dashboard-status-failed"}`}>
                          {user.isPhoneVerified ? "Verified" : "Not Verified"}
                        </span>
                      </td>
                      <td>
                        <span className={`dashboard-status ${user.isAttemptQuiz ? "dashboard-status-warning" : "dashboard-status-success"}`}>
                          {user.isAttemptQuiz ? "Top-up Required" : "Can Play"}
                        </span>
                      </td>
                      <td>{user.currentSzlAssigned || 0}</td>
                      <td>{user.questionsPlayedToday || 0}/10</td>
                      <td>{formatDateTime(user.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="dashboard-empty">No users found.</td></tr>
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
      </div>
    </div>
  );
}
