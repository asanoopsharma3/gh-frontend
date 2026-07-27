import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FilePlus2,
  LogOut,
  Menu,
  RefreshCw,
  Users,
  X,
  ListChecks,
} from "lucide-react";
import Swal from "sweetalert2";
import logo from "../assets/image1.png";
import "./AdminLayout.css";

const navGroups = [
  {
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Subscribers", path: "/admin/subscribers", icon: Users },
      { label: "Renewal Subscribers", path: "/admin/renewal-subscribers", icon: RefreshCw },
      { label: "Churn Subscribers", path: "/admin/churn-subscribers", icon: AlertTriangle },
    ],
  },
  {
    label: "Content Management",
    items: [
      { label: "Quiz Upload", path: "/admin/add-quiz", icon: FilePlus2 },
      { label: "Quizzes", path: "/admin/quizzes", icon: ListChecks },
    ],
  },
  {
    label: "User Management",
    items: [{ label: "All Users", path: "/admin/allusers", icon: Users }],
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageLabel =
    navGroups.flatMap((group) => group.items).find((item) => item.path === location.pathname)?.label ||
    "Overview";

  const handlePageChange = (page) => {
    navigate(page);
    setSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    if (window.innerWidth >= 960) {
      setSidebarCollapsed((collapsed) => !collapsed);
      return;
    }
    setSidebarOpen(true);
  };

  const handleLogout = () => {
    setProfileMenuOpen(false);
    Swal.fire({
      title: "Logout?",
      text: "Your admin session will be cleared.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#06b6d4",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token");
        navigate("/admin/login");
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={`admin-shell ${sidebarCollapsed ? "admin-shell-collapsed" : ""}`}>
      <aside
        className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}
      >
        <div className="admin-sidebar-logo">
          <img src={logo} alt="Super Winnings" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-sidebar-close"
            aria-label="Close sidebar"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navGroups.map((group, groupIndex) => (
            <div className="admin-nav-group" key={group.label || groupIndex}>
              {group.label && <p className="admin-nav-label">{group.label}</p>}
              {group.items.map(({ label, path, icon: Icon }) => {
                const active =
                  location.pathname === path ||
                  (path === "/admin/dashboard" && location.pathname === "/admin");
                return (
                  <button
                    key={path}
                    className={`admin-nav-item ${active ? "admin-nav-item-active" : ""}`}
                    onClick={() => handlePageChange(path)}
                  >
                    {React.createElement(Icon, { size: 18 })}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <button onClick={handleLogout} className="admin-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-button"
              onClick={handleSidebarToggle}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="admin-breadcrumb">
              <span>Dashboard</span>
              <ChevronRight size={15} />
              <strong>{currentPageLabel}</strong>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button className="admin-notification" aria-label="Notifications">
              <Bell size={20} />
              <span />
            </button>

            <div className="admin-profile-wrap" ref={profileRef}>
              <button
                type="button"
                className="admin-profile"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-expanded={profileMenuOpen}
              >
                <div className="admin-avatar">A</div>
                <div>
                  <strong>Admin</strong>
                  <span>Administrator</span>
                </div>
                <ChevronDown size={16} className={profileMenuOpen ? "admin-chevron-open" : ""} />
              </button>

              {profileMenuOpen && (
                <div className="admin-profile-menu">
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
