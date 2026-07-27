import axios from "../../axiosInstance";
import { useEffect, useState } from "react";

const statItems = [
  ["totalAttempts", "Total Sets"],
  ["totalQuestionsPlayed", "Questions Attempted"],
  ["totalCorrect", "Correct Answers"],
  ["totalWrong", "Wrong Answers"],
  ["perfectSets", "Perfect Sets"],
  ["failedSets", "Failed Sets"],
  ["topupCount", "Top-up Count"],
  ["winningChance", "Winning Chance"],
];

export default function Userprofile() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
        setStats(response.data.profileStats);
      })
      .catch((error) => {
        console.log("Error fetching user:", error?.response?.data || error);
      });
  }, []);

  if (!user || !stats) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        Loading Profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white px-4 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-black/60 p-5 shadow-[0_0_35px_rgba(14,165,233,0.25)]">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-300">User Profile</p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-4xl">{user.phone}</h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="rounded-full bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200">
              Subscription: {stats.subscriptionStatus}
            </span>
            <span className="rounded-full bg-purple-500/15 px-4 py-2 text-sm font-semibold text-purple-200">
              Access: {stats.quizAccessStatus === "topup_required" ? "Top-up Required" : "Can Play"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map(([key, label]) => (
            <div
              key={key}
              className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur"
            >
              <p className="text-sm font-semibold text-sky-200">{label}</p>
              <strong className="mt-3 block bg-gradient-to-r from-orange-400 via-sky-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
                {key === "winningChance" ? `${stats[key]}%` : stats[key]}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-bold text-white">Quiz History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/10 text-sky-200">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Questions</th>
                  <th className="px-5 py-3">Correct</th>
                  <th className="px-5 py-3">Wrong</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {(user.quizHistory || []).map((item) => (
                  <tr key={item._id} className="border-t border-white/10">
                    <td className="px-5 py-3">{new Date(item.date).toLocaleString()}</td>
                    <td className="px-5 py-3">{item.totalQuestions}</td>
                    <td className="px-5 py-3 text-green-300">{item.correct ?? item.score}</td>
                    <td className="px-5 py-3 text-red-300">
                      {item.wrong ?? Math.max((item.totalQuestions || 0) - (item.score || 0), 0)}
                    </td>
                    <td className="px-5 py-3">{item.score}/{item.totalQuestions}</td>
                    <td className="px-5 py-3">{item.timeTaken || 0}s</td>
                  </tr>
                ))}
                {(!user.quizHistory || user.quizHistory.length === 0) && (
                  <tr>
                    <td className="px-5 py-8 text-center text-gray-300" colSpan="6">
                      No quiz attempts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
