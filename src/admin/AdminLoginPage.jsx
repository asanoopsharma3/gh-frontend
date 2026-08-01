import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Swal from "sweetalert2";
import brandLogo from "../assets/image1.png";
import { ADMIN_API_BASE } from "../config/api";
import "./AdminLoginPage.css";

const adminLoginUrls = [`${ADMIN_API_BASE}/login`];

const shouldTryNextLoginUrl = (error) => {
  const status = error.response?.status;
  if ([404, 405].includes(status)) return true;
  // Network/CORS failures have no response — try the next URL (e.g. Vite proxy).
  return !error.response;
};

const postAdminLogin = async (payload) => {
  let lastError;

  for (const url of adminLoginUrls) {
    try {
      return await axios.post(url, payload);
    } catch (error) {
      lastError = error;
      if (!shouldTryNextLoginUrl(error)) throw error;
    }
  }

  throw lastError;
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Credentials",
        text: "Please enter your email and password.",
        confirmButtonColor: "#1683f5",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await postAdminLogin({ email, password });
      const token = res.data?.token;

      if (res.data?.success && token) {
        localStorage.setItem("token", token);
        navigate("/admin/dashboard");
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: res.data?.message || "Invalid admin credentials.",
        confirmButtonColor: "#1683f5",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.response?.data?.message || "Unable to sign in. Please try again.",
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <main className="admin-login-shell">
        <Link to="/" className="admin-login-logo-link" aria-label="Go to Super Winnings home">
          <img src={brandLogo} alt="Super Winnings" className="admin-login-logo" />
        </Link>

        <header className="admin-login-heading">
          
        </header>

        <form onSubmit={handleLogin} className="admin-login-card">
          <label className="admin-login-field">
            <span>Email</span>
            <div className="admin-login-input-wrap">
              <Mail className="admin-login-input-icon" size={25} strokeWidth={1.8} />
              <input
                type="email"
                placeholder="admin@unisolutions.in"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <div className="admin-login-input-wrap">
              <Lock className="admin-login-input-icon" size={25} strokeWidth={1.8} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-login-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading} className="admin-login-submit">
            {loading && <span className="admin-login-spinner" />}
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </main>
    </div>
  );
}
