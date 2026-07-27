import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import "./AdminDataPages.css";

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://ghsuperwinnings.com/api/admin/quizzes", { headers });
      if (res.data.success) setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error("Fetch quizzes error:", err);
      Swal.fire({
        icon: "error",
        title: "Quiz Load Failed",
        text: "Unable to load quiz questions. Please try again.",
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDelete = async (quizId, qIndex) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Question?",
      text: "This question will be removed permanently.",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(
        `https://ghsuperwinnings.com/api/admin/quizzes/${quizId}/questions/${qIndex}`,
        { headers }
      );
      await fetchQuizzes();
      setOpenMenuId(null);
      Swal.fire({
        icon: "success",
        title: "Question Deleted",
        text: "The question has been deleted successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: "Failed to delete question. Please try again.",
        confirmButtonColor: "#1683f5",
      });
    }
  };

  const handleEdit = (row) => {
    setEditData({
      quizId: row.quizIdFull,
      qIndex: row.qIndex,
      q: row.q,
      options: [...row.options],
      correctIndex: row.correctIndex,
    });
    setOpenMenuId(null);
  };

  const handleUpdate = async () => {
    try {
      const { quizId, qIndex, q, options, correctIndex } = editData;
      const res = await axios.put(
        `https://ghsuperwinnings.com/api/admin/quizzes/${quizId}/questions/${qIndex}`,
        { q, options, correctIndex },
        { headers }
      );
      if (res.data.success) {
        await fetchQuizzes();
        setEditData(null);
        Swal.fire({
          icon: "success",
          title: "Question Updated",
          text: "Question details updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update question. Please check the details and try again.",
        confirmButtonColor: "#1683f5",
      });
    }
  };

  const allQuestions = useMemo(
    () =>
      quizzes.flatMap((quiz) =>
        (quiz.questions || []).map((question, index) => ({
          id: `${quiz._id}-${index}`,
          quizId: quiz._id?.slice(-4).toUpperCase() || "QZ",
          q: question.q,
          options: question.options || [],
          correctIndex: question.correctIndex,
          quizIdFull: quiz._id,
          qIndex: index,
        }))
      ),
    [quizzes]
  );

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allQuestions;
    return allQuestions.filter((row) =>
      [row.quizId, row.q, row.options.join(" "), String.fromCharCode(65 + row.correctIndex)]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
  }, [allQuestions, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const currentQuestions = filteredQuestions.slice(pageStart, pageStart + rowsPerPage);

  return (
    <div className="quiz-management-page">
      <div className="quiz-management-header">
        <div>
          <h1>Quiz Management</h1>
          <p>View, edit and manage all quiz questions from one place.</p>
        </div>
        <div className="quiz-count">{filteredQuestions.length} Questions</div>
      </div>

      <section className="quiz-table-card">
        <div className="quiz-table-toolbar">
          <div>
            <h2>Question List</h2>
            <p>{filteredQuestions.length} records found</p>
          </div>
          <label className="quiz-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search question, option or ID..."
            />
          </label>
        </div>

        <div className="quiz-table-scroll">
          <table className="quiz-table">
            <thead>
              <tr>
                <th>Quiz ID</th>
                <th>Question</th>
                <th>Options</th>
                <th>Correct Answer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="quiz-empty">Loading questions...</td></tr>
              ) : currentQuestions.length ? (
                currentQuestions.map((row) => (
                  <tr key={row.id}>
                    <td><span className="quiz-id-badge">#{row.quizId}</span></td>
                    <td className="quiz-question-cell">{row.q}</td>
                    <td>
                      <div className="quiz-options">
                        {row.options.map((option, index) => (
                          <span key={`${row.id}-${index}`}>
                            <b>{String.fromCharCode(65 + index)}</b>{option}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="quiz-answer-badge">
                        {String.fromCharCode(65 + row.correctIndex)}
                      </span>
                    </td>
                    <td className="quiz-action-cell">
                      <button
                        className="quiz-menu-button"
                        onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                        aria-label="Question actions"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === row.id && (
                        <div className="quiz-action-menu">
                          <button onClick={() => handleEdit(row)}>
                            <Edit3 size={15} /> Edit
                          </button>
                          <button className="quiz-delete-action" onClick={() => handleDelete(row.quizIdFull, row.qIndex)}>
                            <Trash2 size={15} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="quiz-empty">No questions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="quiz-pagination-footer">
          <label>
            Rows per page:
            <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </label>

          <div className="quiz-pagination">
            <span>
              {filteredQuestions.length
                ? `${pageStart + 1}-${Math.min(pageStart + rowsPerPage, filteredQuestions.length)} of ${filteredQuestions.length}`
                : "0 records"}
            </span>
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => totalPages <= 5 || Math.abs(page - safePage) <= 2)
              .map((page) => (
                <button
                  key={page}
                  className={page === safePage ? "quiz-page-active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {editData && (
        <div className="quiz-modal-backdrop">
          <div className="quiz-edit-modal">
            <div className="quiz-modal-header">
              <div>
                <h2>Edit Question</h2>
                <p>Update question text, options and correct answer.</p>
              </div>
              <button onClick={() => setEditData(null)} aria-label="Close edit dialog">
                <X size={20} />
              </button>
            </div>

            <label className="quiz-edit-field">
              <span>Question</span>
              <textarea
                value={editData.q}
                onChange={(event) => setEditData({ ...editData, q: event.target.value })}
                rows={3}
              />
            </label>

            <div className="quiz-edit-options">
              {editData.options.map((option, index) => (
                <label className="quiz-edit-field" key={index}>
                  <span>Option {String.fromCharCode(65 + index)}</span>
                  <input
                    value={option}
                    onChange={(event) => {
                      const nextOptions = [...editData.options];
                      nextOptions[index] = event.target.value;
                      setEditData({ ...editData, options: nextOptions });
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="quiz-correct-options">
              <span>Correct answer</span>
              <div>
                {editData.options.map((_, index) => (
                  <label key={index}>
                    <input
                      type="radio"
                      checked={editData.correctIndex === index}
                      onChange={() => setEditData({ ...editData, correctIndex: index })}
                    />
                    Option {String.fromCharCode(65 + index)}
                  </label>
                ))}
              </div>
            </div>

            <div className="quiz-modal-actions">
              <button className="quiz-cancel-button" onClick={() => setEditData(null)}>Cancel</button>
              <button className="quiz-save-button" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
