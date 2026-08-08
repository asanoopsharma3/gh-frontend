import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import bannerImg from "../assets/banner.jpg";
import "./Leaderboard.css";

const FALLBACK_LEADERBOARD = [
  { userId: "SW-1001", phone: "233241234567", dailyPoints: 100, dailyTimeTaken: 118 },
  { userId: "SW-1002", phone: "233559876543", dailyPoints: 90, dailyTimeTaken: 132 },
  { userId: "SW-1003", phone: "233207654321", dailyPoints: 80, dailyTimeTaken: 145 },
  { userId: "SW-1004", phone: "233501112233", dailyPoints: 70, dailyTimeTaken: 151 },
  { userId: "SW-1005", phone: "233544556677", dailyPoints: 60, dailyTimeTaken: 160 },
  { userId: "SW-1006", phone: "233209988776", dailyPoints: 50, dailyTimeTaken: 168 },
  { userId: "SW-1007", phone: "233551234890", dailyPoints: 40, dailyTimeTaken: 175 },
  { userId: "SW-1008", phone: "233276543210", dailyPoints: 30, dailyTimeTaken: 182 },
];

const maskPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 6) return phone || "-";
  return `${digits.slice(0, 5)}****${digits.slice(-2)}`;
};

export default function Leaderboard({ preview = false }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDummy, setIsDummy] = useState(false);

  useEffect(() => {
    if (preview) {
      setLeaderboardData(
        FALLBACK_LEADERBOARD.map((item, index) => ({ ...item, rank: index + 1 }))
      );
      setIsDummy(true);
      setLoading(false);
      return undefined;
    }

    const fetchLeaderboard = async () => {
      try {
        const response = await axiosInstance.get("/quiz/leaderboard");
        if (response.data.success) {
          const rows = (response.data.leaderboard || []).map((item, index) => ({
            ...item,
            rank: index + 1,
          }));
          setLeaderboardData(rows);
          setIsDummy(Boolean(response.data.isDummy));
        } else {
          setError(response.data.message || "Failed to fetch leaderboard");
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setLeaderboardData(
          FALLBACK_LEADERBOARD.map((item, index) => ({ ...item, rank: index + 1 }))
        );
        setIsDummy(true);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [preview]);

  if (loading) {
    return <div className="leaderboard-status">Loading leaderboard...</div>;
  }

  if (error) {
    return <div className="leaderboard-status is-error">Error: {error}</div>;
  }

  return (
    <div
      className="leaderboard-page"
      style={{ backgroundImage: `url(${bannerImg})` }}
    >
      <div className="leaderboard-overlay" aria-hidden="true" />

      <div className="leaderboard-content">
        <h1 className="leaderboard-title">🏆 LEADERBOARD 🏆</h1>

        {isDummy && (
          <p className="leaderboard-note">
            {preview
              ? "Preview mode — sample rankings shown without login."
              : "Showing sample rankings for testing. Real scores appear after eligible daily quiz attempts."}
          </p>
        )}

        <div className="leaderboard-table">
          <div className="leaderboard-head">
            <span>RANK</span>
            <span>Mobile No</span>
            <span>ID</span>
            <span>DAILY POINTS</span>
            <span>TIME TAKEN (s)</span>
          </div>

          {leaderboardData.map((player) => (
            <div
              key={`${player.userId}-${player.rank}`}
              className={`leaderboard-row ${player.rank === 1 ? "is-top" : ""}`}
            >
              <div className="leaderboard-rank">#{player.rank}</div>

              <div className="leaderboard-phone-wrap">
                <span
                  className={`leaderboard-avatar ${
                    player.rank === 1
                      ? "rank-1"
                      : player.rank === 2
                        ? "rank-2"
                        : player.rank === 3
                          ? "rank-3"
                          : "rank-default"
                  }`}
                >
                  {player.phone ? String(player.phone).slice(-1) : "U"}
                </span>
                <span className="leaderboard-phone">{maskPhone(player.phone)}</span>
              </div>

              <span className="leaderboard-cell">{player.userId}</span>
              <span className="leaderboard-cell">{player.dailyPoints}</span>
              <span className="leaderboard-cell">{player.dailyTimeTaken}s</span>

              <div className="leaderboard-meta">
                <span>ID: {player.userId}</span>
                <span>Points: {player.dailyPoints}</span>
                <span>Time: {player.dailyTimeTaken}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
