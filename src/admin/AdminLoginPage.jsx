import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Swal from "sweetalert2";
import brandLogo from "../assets/image1.png";
import "./AdminLoginPage.css";

const adminLoginUrls = [
  "https://ghsuperwinnings.com/api/admin/login",
  "https://ghsuperwinnings.com:5000/api/admin/login",
  "http://ghsuperwinnings.com:5000/api/admin/login",
  "/api/admin/login",
  "/admin-api/login",
];

const postAdminLogin = async (payload) => {
  let lastError;

  for (const url of adminLoginUrls) {
    try {
      return await axios.post(url, payload);
      } catch (error) {
        lastError = error;
      if (![404, 405].includes(error.response?.status)) throw error;
    }
  }

  throw lastError;
};
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
