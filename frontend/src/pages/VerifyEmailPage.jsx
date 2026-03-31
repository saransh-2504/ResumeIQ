import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// This page handles the link from the verification email
// URL: /verify-email?token=xxxxx
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    // Call backend to verify the token
    api
      .get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        loginUser(res.data.user, res.data.token); // auto-login after verification
        setStatus("success");
        setMessage(res.data.message);

        // Redirect to correct dashboard after 2 seconds
        setTimeout(() => {
          const role = res.data.user.role;
          if (role === "recruiter") navigate("/recruiter");
          else navigate("/dashboard");
        }, 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">🔄</div>
            <p className="text-gray-600 text-sm">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Email Verified!</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-400 mt-2">Redirecting you...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-sm text-indigo-600 hover:underline"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
