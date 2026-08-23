import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  Trophy,
  Box,
  LifeBuoy,
  LogOut,
  User,
  CircleUserRound,
  FileText,
  Home,
  PhoneOff,
} from "lucide-react";
import Logo from "../assets/image1.png";
import { GrTransaction } from "react-icons/gr";
import { useAuth } from "../auth/AuthContext";
import Swal from "sweetalert2";
import { unsubscribeCurrentUser } from "../config/subscription";


export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const closeMenus = () => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const onUnsubscribeHandler = () => {
    Swal.fire({
      title: "Unsubscribe?",
      html: `
        <p>Are you sure you want to unsubscribe?</p>
        <p style="margin-top:10px;font-size:14px;color:#555;">
          This will unsubscribe your MTN number, stop daily quiz access.
        </p>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Unsubscribe",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#fff",
      color: "#333",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#28a745",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Unsubscribing...",
        text: "Please wait while we update your number.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const data = await unsubscribeCurrentUser();
        logout(false);
        closeMenus();
        await Swal.fire({
          title: data.message || "Unsubscribe successful",
          text:
            data.description ||
            data.mtn?.description ||
            "Your number has been unsubscribed and your session has been cleared.",
          icon: "success",
          confirmButtonColor: "#1683f5",
        });
        navigate("/subscribe?fallback=true", { replace: true });
      } catch (error) {
        if (error.status === 401) {
          logout(false);
          closeMenus();
          await Swal.fire({
            title: "Session Cleared",
            text: "Your login session was no longer valid, so it has been cleared. Subscribe again if you want to play.",
            icon: "info",
            confirmButtonColor: "#1683f5",
          });
          navigate("/subscribe?fallback=true", { replace: true });
          return;
        }

        Swal.fire({
          title: error.message || "Unsubscribe Failed",
          text: error.description || error.message || "Unable to unsubscribe right now. Please try again.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    });
  };

  const onLogoutHandler = () => {
    Swal.fire({
      title: "Logout Account",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: "#fff",
      color: "#333",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#28a745",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          title: "Logged Out!",
          text: "You have been successfully logged out.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    });
  };

  const showLeaderboard =
    isLoggedIn || import.meta.env.VITE_LEADERBOARD_PREVIEW === "true";
  return (
    <header className="relative z-50">
      <div className="bg-black text-white flex items-center justify-between px-4 md:px-8 py-3 shadow-lg">
        
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <img src={Logo} alt="logo" className="h-16 w-auto" />
        </Link>

        {/* ---------------- DESKTOP MENU ---------------- */}
        <ul className="hidden md:flex items-center gap-6 text-lg font-semibold">
{/* HOME / PLAY BUTTON */}
             <li className="relative group flex items-center gap-1">
            <Home size={18} className="text-white" />
            <Link to="/" className="text-white transition duration-300">
              HOME
            </Link>
          </li>
          {showLeaderboard && (
            <li className="relative group flex items-center gap-1">
              <Trophy size={18} />
             <Link to="/leaderboard" className="text-white transition duration-300">
  LEADERBOARD
</Link>
            </li>
          )}

          

          <li className="relative group flex items-center gap-1">
            <Box size={18} />
            <Link to="/product" className="text-white transition duration-300">
              PRODUCTS
            </Link>
          </li>

          <li className="relative group flex items-center gap-1">
            <LifeBuoy size={18} />
            <Link to="/support" className="text-white transition duration-300">
              SUPPORT
            </Link>
          </li>

          {/* <li className="relative group flex items-center gap-1">
            <FileText size={18} />
            <Link to="/terms" className="text-white transition duration-300">
              TERMS
            </Link>
          </li> */}

          {/* -------- DESKTOP USER DROPDOWN -------- */}
          <li
            className="relative group"
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            {isLoggedIn ? (
              <button className="flex items-center gap-1 px-4 py-1 border border-white rounded-lg hover:bg-gray-800 transition">
                <CircleUserRound size={16} /> USER
              </button>
            ) : (
              <Link to="/subscribe?fallback=true" className="flex items-center gap-1 text-white">
                <User size={16} /> SUBSCRIBE
              </Link>
            )}

            {isLoggedIn && userMenuOpen && (
              <div className="absolute right-0 top-full w-44 bg-white text-black rounded-lg shadow-lg border z-50">
                <button
                  onClick={() => navigate("/user-profile")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <CircleUserRound size={16} /> Profile
                </button>

                <button
                  onClick={onUnsubscribeHandler}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <PhoneOff size={14} />
                  </span>
                  Unsubscribe
                </button>

                <button
                  onClick={onLogoutHandler}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </li>
        </ul>

        {/* MOBILE HAMBURGER */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* ---------------- MOBILE MENU ---------------- */}
      <div
        className={`md:hidden bg-black overflow-hidden transition-all duration-500 ${
          menuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-4 mt-4 pb-4 px-4">
 {/* HOME / PLAY BUTTON */}
             <li className="relative group flex items-center gap-1">
            <Home size={18} className="text-white" />
            <Link to="/" className="text-white transition duration-300">
              HOME
            </Link>
          </li>
          {showLeaderboard && (
            <li className="flex items-center gap-2">
              <Trophy size={18} className="text-white" />
              <Link to="/leaderboard" onClick={() => setMenuOpen(false)} className="text-white">
                LEADERBOARD
              </Link>
            </li>
          )}

          

          <li className="flex items-center gap-2">
            <Box size={18} className="text-white" />
            <Link to="/product" onClick={() => setMenuOpen(false)} className="text-white">
              PRODUCTS
            </Link>
          </li>

          <li className="flex items-center gap-2">
            <LifeBuoy size={18} className="text-white" />
            <Link to="/support" onClick={() => setMenuOpen(false)} className="text-white">
              SUPPORT
            </Link>
          </li>

          <li className="flex items-center gap-2">
            <FileText size={18} className="text-white" />
            <Link to="/terms" onClick={() => setMenuOpen(false)} className="text-white">
              TERMS
            </Link>
          </li>

          {/* -------- MOBILE USER DROPDOWN -------- */}
          <li className="relative">

            {isLoggedIn ? (
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-1 justify-center py-2 bg-white text-black rounded-lg"
              >
                <CircleUserRound size={16} /> USER
              </button>
            ) : (
              <Link
                to="/subscribe?fallback=true"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-1 justify-center py-2 bg-white text-black rounded-lg"
              >
                <User size={16} /> SUBSCRIBE
              </Link>
            )}

            {isLoggedIn && userMenuOpen && (
              <div className="mt-2 bg-white text-black rounded-lg shadow-lg border w-full">

                <button
                  onClick={() => {
                    navigate("/user-profile");
                    setUserMenuOpen(false);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200 flex items-center gap-2"
                >
                  <CircleUserRound size={16} /> Profile
                </button>

                <button
                  onClick={onUnsubscribeHandler}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200 flex items-center gap-2 text-red-600"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <PhoneOff size={14} />
                  </span>
                  Unsubscribe
                </button>
                
                <button
                  onClick={onLogoutHandler}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
