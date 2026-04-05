import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { communityApi } from "../api/community";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/common/NotificationBell";

function CommunityCard({ community, joined, onJoin, joining }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-base">
          {community.name[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{community.name}</p>
          <p className="text-xs text-gray-400">@{community.domain} · {community.memberCount} members</p>
        </div>
      </div>
      {joined ? (
        <button
          onClick={() => navigate(`/community/${community._id}`)}
          className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-semibold hover:bg-indigo-700 transition">
          Open
        </button>
      ) : (
        <button
          onClick={() => onJoin(community._id)}
          disabled={joining === community._id}
          className="text-xs border border-indigo-300 text-indigo-600 px-4 py-1.5 rounded-xl font-semibold hover:bg-indigo-50 transition disabled:opacity-50">
          {joining === community._id ? "Joining..." : "Join"}
        </button>
      )}
    </div>
  );
}

export default function CommunityDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [joined, setJoined] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    communityApi.discover()
      .then((res) => {
        setJoined(res.data.joined);
        setSuggested(res.data.suggested);
      })
      .catch(() => setError("Failed to load communities."))
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(communityId) {
    setJoining(communityId);
    try {
      await communityApi.join(communityId);
      // Move from suggested to joined
      const community = suggested.find((c) => c._id === communityId);
      if (community) {
        setSuggested((prev) => prev.filter((c) => c._id !== communityId));
        setJoined((prev) => [...prev, { ...community, memberCount: community.memberCount + 1 }]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join.");
    } finally {
      setJoining(null);
    }
  }

  // Filter by search
  const searchLower = search.toLowerCase();
  const filteredJoined = joined.filter((c) =>
    c.name.toLowerCase().includes(searchLower) || c.domain.toLowerCase().includes(searchLower)
  );
  const filteredSuggested = suggested.filter((c) =>
    c.name.toLowerCase().includes(searchLower) || c.domain.toLowerCase().includes(searchLower)
  );

  // Role label for back navigation
  const backPath = user?.role === "recruiter" ? "/recruiter" : user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(backPath)}
            className="text-gray-400 hover:text-gray-600 transition text-lg leading-none">←</button>
          <span className="text-lg font-bold text-indigo-600">
            Resume<span className="text-purple-500">IQ</span>
          </span>
          <span className="text-sm font-semibold text-gray-700">Community</span>
        </div>
        <NotificationBell />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities by company name..."
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-2xl text-sm outline-none focus:border-indigo-400 bg-white shadow-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading communities...</div>
        ) : (
          <>
            {/* Joined communities */}
            {filteredJoined.length > 0 && (
              <section className="mb-8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Your Communities
                </p>
                <div className="space-y-3">
                  {filteredJoined.map((c) => (
                    <CommunityCard key={c._id} community={c} joined onJoin={handleJoin} joining={joining} />
                  ))}
                </div>
              </section>
            )}

            {/* Suggested communities */}
            {filteredSuggested.length > 0 && (
              <section className="mb-8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {joined.length > 0 ? "Suggested Communities" : "Discover Communities"}
                </p>
                <div className="space-y-3">
                  {filteredSuggested.map((c) => (
                    <CommunityCard key={c._id} community={c} joined={false} onJoin={handleJoin} joining={joining} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {filteredJoined.length === 0 && filteredSuggested.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🏘️</p>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {search ? "No communities match your search" : "No communities yet"}
                </p>
                <p className="text-xs text-gray-400">
                  {search
                    ? "Try a different search term"
                    : "Communities are created automatically when recruiters set up their company profile."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
