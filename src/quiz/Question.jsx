import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosInstance";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";

function Question() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndexInSet, setCurrentQuestionIndexInSet] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timer, setTimer] = useState(15);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [totalQuestionsInQuiz, setTotalQuestionsInQuiz] = useState(0);
  const [overallQuestionIndex, setOverallQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionsPerSet, setQuestionsPerSet] = useState(10);

  const token = localStorage.getItem("token");
  const isMobile = window.innerWidth < 640;

  const forceSubscriptionLogout = useCallback(
    async (message) => {
      localStorage.removeItem("payment_done");
      localStorage.removeItem("offerCode");
      await Swal.fire({
        icon: "warning",
        title: "Subscription Inactive",
        text: message || "Your subscription is inactive. Please subscribe again.",
        confirmButtonColor: "#3085d6",
      });
      logout(true);
    },
    [logout]
  );

  const verifyPlayAccess = useCallback(async () => {
    let res;
    try {
      res = await axios.get("/subscription/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      if (err.response?.status === 401) {
        await forceSubscriptionLogout("Your session expired. Please subscribe again.");
        return false;
      }

      await Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Unable to verify your subscription. Please try again.",
        confirmButtonColor: "#1683f5",
      });
      return false;
    }

    const subscription = res.data.subscription;

    if (subscription.subscriptionStatus !== "active") {
      await forceSubscriptionLogout(subscription.message);
      return false;
    }

    if (!subscription.canPlay) {
      await Swal.fire({
        icon: "info",
        title: "Top-up Required",
        text: subscription.message || "A wrong answer locked your next set. Please top up to unlock 10 more questions.",
        confirmButtonText: "Top up",
        confirmButtonColor: "#1683f5",
      });
      localStorage.removeItem("payment_done");
      navigate("/topup");
      return false;
    }

    return true;
  }, [forceSubscriptionLogout, navigate, token]);

  const fetchQuestionSet = useCallback(async () => {
    const canPlay = await verifyPlayAccess();
    if (!canPlay) return;

    setLoading(true);

    try {
      const res = await axios.get("/quiz/questionset", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const {
          questions: fetchedQuestions,
          startIndex,
          totalQuestions,
          questionsPerSet: setSize,
        } = res.data;

        setQuestionsPerSet(setSize || 10);
        setQuestions(fetchedQuestions);
        setOverallQuestionIndex(startIndex);
        setTotalQuestionsInQuiz(totalQuestions);
        setCurrentQuestionIndexInSet(0);
        setScore(0);
        setStartTime(Date.now());
      } else {
        await Swal.fire({
          icon: "error",
          title: "Oops!",
          text: res.data.message || "Failed to fetch questions.",
        });
        navigate("/topup");
      }
    } catch (err) {
      console.error("Error fetching question set:", err);

      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        if (err.response.data?.code === "SUBSCRIPTION_INACTIVE") {
          await forceSubscriptionLogout(err.response.data.message);
          return;
        }

        await Swal.fire({
          icon: "warning",
          title: err.response.data?.code === "TOPUP_REQUIRED" ? "Top-up Required" : "Access Denied",
          text: err.response.data.message || "Please top up to continue.",
          confirmButtonText: err.response.data?.code === "TOPUP_REQUIRED" ? "Top up" : "OK",
          confirmButtonColor: "#1683f5",
        });
        navigate(err.response.data?.code === "TOPUP_REQUIRED" ? "/topup" : "/subscribe?fallback=true");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Error fetching questions. Please try again.",
        });
        navigate("/subscribe?fallback=true");
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate, verifyPlayAccess, forceSubscriptionLogout]);

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Login Required",
        text: "Please log in to start the quiz.",
        confirmButtonColor: "#3085d6",
      });
      navigate("/subscribe?fallback=true");
      return;
    }

    fetchQuestionSet();
  }, [token, navigate, fetchQuestionSet]);

  useEffect(() => {
    if (!token) return undefined;

    const interval = setInterval(() => {
      void verifyPlayAccess();
    }, 15000);

    return () => clearInterval(interval);
  }, [token, verifyPlayAccess]);

  useEffect(() => {
    if (questions.length === 0 || loading) return undefined;

    setTimer(15);

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          void handleNextQuestion(score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndexInSet, questions, loading, score]);

  const handleNextQuestion = useCallback(
    async (finalScore = score) => {
      setSelected(null);

      const nextIndexInSet = currentQuestionIndexInSet + 1;
      const nextOverallIndex = overallQuestionIndex + 1;

      if (nextIndexInSet < questions.length) {
        setCurrentQuestionIndexInSet(nextIndexInSet);
        setOverallQuestionIndex(nextOverallIndex);
        return;
      }

      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      try {
        await axios.post(
          "/quiz/mark-attempted",
          { score: finalScore, timeTaken },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Error marking attempt:", err);
        if (err.response?.data?.code === "SUBSCRIPTION_INACTIVE") {
          await forceSubscriptionLogout(err.response.data.message);
          return;
        }
      }

      if (finalScore === questionsPerSet) {
        if (nextOverallIndex < totalQuestionsInQuiz) {
          await Swal.fire({
            icon: "success",
            title: "Perfect Score!",
            text: "Fetching next set of questions...",
            confirmButtonText: "Continue",
            confirmButtonColor: "#3085d6",
          });

          await fetchQuestionSet();
          return;
        }

        await Swal.fire({
          icon: "success",
          title: "Quiz Finished!",
          text: "You completed all questions successfully!",
          confirmButtonText: "View Profile",
          confirmButtonColor: "#28a745",
        });
        navigate("/user-profile");
        return;
      }

      await Swal.fire({
        icon: "info",
        title: "Top-up Required",
        text: `Your score is ${finalScore}/${questionsPerSet}. One or more answers were wrong, so please top up to unlock the next 10 questions.`,
        confirmButtonText: "Top up",
        confirmButtonColor: "#1683f5",
      });

      localStorage.removeItem("payment_done");
      navigate("/topup");
    },
    [
      currentQuestionIndexInSet,
      questions.length,
      overallQuestionIndex,
      score,
      totalQuestionsInQuiz,
      fetchQuestionSet,
      navigate,
      startTime,
      token,
      questionsPerSet,
      forceSubscriptionLogout,
    ]
  );

  const handleAnswer = (opt, i) => {
    if (selected !== null) return;

    setSelected(i);

    const currentQuestion = questions[currentQuestionIndexInSet];
    const correctIndex = parseInt(currentQuestion.correctIndex, 10);
    const correctAnswer = currentQuestion.options[correctIndex];
    const isCorrect = opt === correctAnswer;

    setScore((prev) => {
      const newScore = isCorrect ? prev + 1 : prev;
      setTimeout(() => {
        void handleNextQuestion(newScore);
      }, 600);
      return newScore;
    });
  };

  if (loading) return <p className="text-white">Loading quiz...</p>;
  if (questions.length === 0) return <p className="text-red-500">No quiz available.</p>;

  const q = questions[currentQuestionIndexInSet];

  return (
    <div className={`question-box relative ${isMobile ? "mt-2 px-2" : "top-[8px]"}`}>
      <div className="w-full flex justify-between mb-2 sm:hidden px-2 mt-1">
        <p className="font-bold text-white text-base">Score: {score * 10}</p>
        <p className={`font-bold ${timer <= 5 ? "text-red-500" : "text-white"} text-xl`}>
          {timer}
        </p>
      </div>

      <div className="hidden sm:flex fixed top-4 right-4 flex-col items-center justify-center text-white text-[60px] px-4 py-2 z-50 text-center">
        <p className="font-semibold border-4 border-green-800 relative top-[140px] shadow-[0px_0px_5px_5px_white] rounded-md p-2">
          Score: {score * 10}
        </p>
      </div>

      <div className="wrap max-w-full mb-2 md:max-w-3xl mx-auto mt-5">
        <div className="hidden sm:block">
          <div className="count text-center">
            <span style={{ color: timer <= 5 ? "red" : "white" }}>{timer}</span>
          </div>
        </div>

        <div className="border mb-4 sm:mb-2">
          <div className="question gradient-border">
            <div>{q.q}</div>
          </div>
        </div>

        <ul
          className={`${
            isMobile
              ? "flex flex-col gap-3 w-full"
              : "flex flex-wrap justify-center gap-6 p-4 relative top-[-40px]"
          }`}
        >

          {q.options.map((opt, i) => {
            const correctIndex = parseInt(q.correctIndex, 10);
            let bgColor = "#170324";

            if (selected !== null) {
              if (i === correctIndex) bgColor = "green";
              else if (i === selected) bgColor = "red";
            }

            return (
              <li
                key={i}
                className={`${isMobile ? "w-full" : "w-[42%] text-white text-center p-2 rounded"}`}
              >
                <label
                  onClick={() => handleAnswer(opt, i)}
                  style={{
                    background: bgColor,
                    color: "white",
                    borderRadius: isMobile ? "10px" : "999px",
                    padding: "10px 14px",
                    cursor: selected !== null ? "not-allowed" : "pointer",
                    border: "2px solid rgba(255,255,255,0.2)",
                    boxShadow: isMobile ? "0px 0px 2px 2px white" : "none",
                    transition: "all 0.3s ease-in-out",
                    opacity:
                      selected !== null && i !== selected && i !== correctIndex ? 0.6 : 1,
                  }}
                >
                  {opt}
                </label>
              </li>
            );
          })}
        </ul>

        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={() => void handleNextQuestion(score)}
            className="glow-on-hover mt-4 mb-8 px-6 py-3 w-[90%] sm:w-auto"
          >
            {overallQuestionIndex + 1 === totalQuestionsInQuiz ? "FINISH" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Question;
