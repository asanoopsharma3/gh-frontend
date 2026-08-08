import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Trophy, Box, LifeBuoy, LogOut, User, CircleUserRound, FileText } from "lucide-react";
import Logo from "../assets/image1.png";
import { GrTransaction } from "react-icons/gr";
import { useAuth } from "../auth/AuthContext";
import Swal from "sweetalert2";
import { BellOff } from "lucide-react";
import { Home } from "lucide-react";


export default function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

          <li className="relative group flex items-center gap-1">
            <FileText size={18} />
            <Link to="/terms" className="text-white transition duration-300">
              TERMS
            </Link>
          </li>

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
                 
                 <button className="flex items-center  text-black gap-2  px-4 py-20">
                  <BellOff size={20} />
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

                   <button className="flex items-center  text-black gap-2  px-4 py-20">
                  <BellOff size={20} />
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
