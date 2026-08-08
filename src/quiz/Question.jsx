import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../axiosInstance";
import Swal from "sweetalert2";
import { useAuth } from "../auth/AuthContext";
import "./Question.css";

const PREVIEW_QUIZ_QUESTIONS = [
  {
    q: "Which of these Ghanaian historical events happened EARLIEST: Ghana gained independence from British colonial rule, Ghana hosted the Africa Cup of Nations, Kwame Nkrumah was overthrown in a military coup, Ghana adopted its Fourth Republican Constitution?",
    options: [
      "Ghana hosted the Africa Cup of Nations",
      "Kwame Nkrumah was overthrown in a military coup",
      "Ghana adopted its Fourth Republican Constitution",
      "Ghana gained independence from British colonial rule",
    ],
    correctIndex: "3",
  },
  {
    q: "Which Ghanaian institution regulates mobile network operators and oversees consumer protection, fair competition, and licensing for telecommunications services nationwide?",
    options: [
      "Bank of Ghana",
      "National Communications Authority (NCA) with extended description to verify wrapping behaviour",
      "Ghana Revenue Authority",
      "Ministry of Finance",
    ],
    correctIndex: "1",
  },
];

function Question({ preview = false }) {
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

  const loadPreviewQuestions = useCallback(() => {
    setQuestionsPerSet(PREVIEW_QUIZ_QUESTIONS.length);
    setQuestions(PREVIEW_QUIZ_QUESTIONS);
    setOverallQuestionIndex(0);
    setTotalQuestionsInQuiz(PREVIEW_QUIZ_QUESTIONS.length);
    setCurrentQuestionIndexInSet(0);
    setScore(0);
    setStartTime(Date.now());
    setLoading(false);
  }, []);

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
    if (preview) return true;

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
      localStorage.removeItem("payment_done");
      navigate("/topup", { replace: true });
      return false;
    }

    return true;
  }, [forceSubscriptionLogout, navigate, preview, token]);

  const fetchQuestionSet = useCallback(async () => {
    if (preview) {
      loadPreviewQuestions();
      return;
    }

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

        if (err.response.data?.code === "TOPUP_REQUIRED") {
          localStorage.removeItem("payment_done");
          navigate("/topup", { replace: true });
          return;
        }

        await Swal.fire({
          icon: "warning",
          title: "Access Denied",
          text: err.response.data.message || "You cannot access the quiz right now.",
          confirmButtonColor: "#1683f5",
        });
        navigate("/subscribe?fallback=true");
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
  }, [token, navigate, verifyPlayAccess, forceSubscriptionLogout, preview, loadPreviewQuestions]);

  useEffect(() => {
    if (preview) {
      loadPreviewQuestions();
      return;
    }

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
  }, [token, navigate, fetchQuestionSet, preview, loadPreviewQuestions]);

  useEffect(() => {
    if (preview || !token) return undefined;

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

      if (!preview) {
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
      }

      if (preview) {
        await Swal.fire({
          icon: "info",
          title: "Preview mode",
          text: `Set finished with score ${finalScore}/${questionsPerSet}. Restarting sample questions.`,
          confirmButtonColor: "#1683f5",
        });
        loadPreviewQuestions();
        return;
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

      localStorage.removeItem("payment_done");
      navigate("/topup", { replace: true });
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
      preview,
      loadPreviewQuestions,
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

  if (loading) return <p className="quiz-status-text">Loading quiz...</p>;
  if (questions.length === 0) return <p className="quiz-status-text quiz-status-error">No quiz available.</p>;

  const q = questions[currentQuestionIndexInSet];

  return (
    <div className="question-box">
      {preview && (
        <p className="quiz-preview-banner">
          UI preview — login / payment bypassed. Open <code>/quiz-preview</code>
        </p>
      )}

      <div className="quiz-stats-bar">
        <div className="quiz-stat quiz-stat-score">
          <span className="quiz-stat-label">Score</span>
          <span className="quiz-stat-value">{score * 10}</span>
        </div>
        <div className="quiz-stat quiz-stat-progress">
          <span className="quiz-stat-label">Question</span>
          <span className="quiz-stat-value">
            {overallQuestionIndex + 1}/{totalQuestionsInQuiz || questionsPerSet}
          </span>
        </div>
        <div className={`quiz-stat quiz-stat-timer ${timer <= 5 ? "is-urgent" : ""}`}>
          <span className="quiz-stat-label">Time</span>
          <span className="quiz-stat-value">{timer}s</span>
        </div>
      </div>

      <div className="quiz-wrap">
        <div className="quiz-question-card">
          <p className="quiz-question-text">{q.q}</p>
        </div>

        <ul className="quiz-answers-list">
          {q.options.map((opt, i) => {
            const correctIndex = parseInt(q.correctIndex, 10);
            const isCorrect = selected !== null && i === correctIndex;
            const isWrong = selected !== null && i === selected && i !== correctIndex;
            const isDimmed = selected !== null && i !== selected && i !== correctIndex;

            return (
              <li key={i} className="quiz-answer-item">
                <button
                  type="button"
                  className={[
                    "quiz-answer-label",
                    isCorrect ? "is-correct" : "",
                    isWrong ? "is-wrong" : "",
                    isDimmed ? "is-dimmed" : "",
                    selected !== null ? "is-disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleAnswer(opt, i)}
                  disabled={selected !== null}
                >
                  <span className="quiz-answer-text">{opt}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="quiz-actions">
          <button
            type="button"
            onClick={() => void handleNextQuestion(score)}
            className="glow-on-hover quiz-next-btn"
          >
            {overallQuestionIndex + 1 === totalQuestionsInQuiz ? "FINISH" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Question;
