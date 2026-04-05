import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <p className="text-6xl font-bold text-indigo-600 mb-2">404</p>
      <p className="text-lg font-semibold text-gray-700 mb-1">Page not found</p>
      <p className="text-sm text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate("/")}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
        Go Home
      </button>
    </div>
  );
}
