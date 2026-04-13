import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

export default function NotificationBell() {
  const { total, breakdown } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleCommunityClick(communityId) {
    setOpen(false);
    navigate(`/community/${communityId}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-[var(--bg-surface)] rounded-2xl shadow-xl border border-[var(--border)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-light)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Notifications</p>
          </div>

          {breakdown.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
              No unread messages
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {breakdown.map((item) => (
                <button
                  key={item.communityId}
                  onClick={() => handleCommunityClick(item.communityId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-surface-2)] transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <span className="text-sm text-[var(--text-primary)] truncate max-w-[160px]">
                      {item.communityName}
                    </span>
                  </div>
                  <span className="text-xs bg-[var(--accent-light)] text-[var(--accent-text)] font-semibold px-2 py-0.5 rounded-full shrink-0">
                    {item.unreadCount} new
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2 border-t border-[var(--border-light)]">
            <button
              onClick={() => { setOpen(false); navigate("/community"); }}
              className="w-full text-xs text-indigo-500 hover:text-indigo-700 font-medium py-1 transition"
            >
              View all communities →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
