import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmailChangePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setStatus("error"); setMessage("Invalid link."); return; }

    api.get(`/settings/email-change/confirm?token=${token}`)
      .then((res) => { setStatus("success"); setMessage(res.data.message); })
      .catch((err) => { setStatus("error"); setMessage(err.response?.data?.message || "Link expired or invalid."); });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="text-4xl mb-4">{status === "loading" ? "⏳" : status === "success" ? "✅" : "❌"}</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          {status === "loading" ? "Verifying..." : status === "success" ? "Email Updated!" : "Verification Failed"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        {status !== "loading" && (
          <button onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
