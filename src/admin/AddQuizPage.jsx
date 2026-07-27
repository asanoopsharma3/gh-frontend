import { useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FileUp, UploadCloud } from "lucide-react";
import "./AdminDataPages.css";

const ADMIN_API_BASE = "/api/admin";

export default function AddQuizPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const token = localStorage.getItem("token");

 

    const formData = new FormData();
    formData.append("title", "Super Winnings Quiz");
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post(`${ADMIN_API_BASE}/quizzes/upload-csv`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Quiz Uploaded",
        text: res.data.message || "CSV questions uploaded successfully.",
        confirmButtonColor: "#1683f5",
      });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: err.response?.data?.message || "Unable to upload CSV.",
        confirmButtonColor: "#1683f5",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-data-page">
      <section className="quiz-upload-card">
        <div className="quiz-upload-header">
          <span>
            <FileUp size={24} />
          </span>
          <div>
            <h1>Quiz Upload</h1>
            <p>Upload a CSV file and create quiz questions in one step.</p>
          </div>
        </div>

        <label className="quiz-upload-drop">
          <UploadCloud size={34} />
          <strong>{file ? file.name : "Choose CSV file"}</strong>
          <small>Allowed columns: q, option1, option2, option3, option4, correctIndex</small>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="quiz-upload-button"
        >
          {uploading ? "Uploading..." : "Upload Quiz CSV"}
        </button>
      </section>
    </div>
  );
}
