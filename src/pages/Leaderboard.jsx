import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";

export default function LeaderboardTable() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axiosInstance.get("/quiz/leaderboard");
        if (response.data.success) {
          const rankedData = response.data.leaderboard.map((item, index) => ({
            ...item,
            rank: index + 1,
          }));
          setLeaderboardData(rankedData);
        } else {
          setError(response.data.message || "Failed to fetch leaderboard");
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        Loading Leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center py-10 px-4 md:px-10 relative"
      style={{
        backgroundImage: `url('/src/assets/banner.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center">
        {/* Header */}
        <h1 className="mt-5 text-3xl md:text-5xl font-bold text-yellow-400 drop-shadow-lg text-center">
          🏆 LEADERBOARD 🏆
        </h1>

        {/* Table Container */}
        <div className="w-full mt-8">
          <div className="backdrop-blur-md bg-transparent rounded-2xl border-4 border-yellow-500 shadow-[0_0_35px_rgba(255,215,0,0.7)] overflow-hidden">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-5 text-sm md:text-base font-bold bg-transparent py-4 px-2 md:px-6 text-yellow-300 border-b border-yellow-500">
              <span className="pl-4">RANK</span>
              <span>Mobile No</span>
              <span>ID</span>
              <span>DAILY POINTS</span>
              <span>TIME TAKEN (s)</span>
            </div>

            {/* Data Rows */}
            {leaderboardData.map((player) => (
              <div
                key={player.rank}
                className={`border-b border-yellow-600/30 transition-all
                  ${
                    player.rank === 1
                      ? "bg-yellow-500/10 animate-pulse shadow-[0_0_15px_rgba(255,255,0,0.5)]"
                      : ""
                  }
                  hover:bg-yellow-400/10 hover:scale-[1.02]
                  md:grid md:grid-cols-5 md:items-center 
                  flex flex-col items-start gap-2 py-4 px-4
                `}
              >
                {/* Rank */}
                <div className="font-bold text-yellow-400 text-lg md:text-xl">
                  #{player.rank}
                </div>

                {/* Mobile Number + Avatar */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-gray-900
                      ${
                        player.rank === 1
                          ? "bg-yellow-400"
                          : player.rank === 2
                          ? "bg-gray-300"
                          : player.rank === 3
                          ? "bg-orange-400"
                          : "bg-white/80"
                      }`}
                  >
                    {player.phone ? player.phone[0] : "U"}
                  </div>
                  <span>{player.phone}</span>
                </div>

                {/* Mobile View */}
                <div className="flex flex-col md:hidden text-sm text-gray-300 pl-[52px]">
                  <span>ID: {player.userId}</span>
                  <span>Daily Points: {player.dailyPoints}</span>
                  <span>Time Taken: {player.dailyTimeTaken}s</span>
                </div>

                {/* Desktop View */}
                <span className="hidden md:block text-sm md:text-base">{player.userId}</span>
                <span className="hidden md:block">{player.dailyPoints}</span>
                <span className="hidden md:block">{player.dailyTimeTaken}s</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-24"></div>
      </div>
    </div>
  );
}
