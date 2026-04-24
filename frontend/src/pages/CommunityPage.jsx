import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { communityApi } from "../api/community";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/common/NotificationBell";

// helpers 

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function RoleBadge({ role }) {
  const map = {
    admin: "bg-red-100 text-red-600",
    recruiter: "bg-purple-100 text-purple-600",
    candidate: "bg-blue-100 text-blue-600",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${map[role] || "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"}`}>
      {role}
    </span>
  );
}

//  Reaction bar 

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "🎉", "🙏"];

function ReactionBar({ communityId, msgId, reactions, currentUserId, onUpdate }) {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {});

  async function handleReact(emoji) {
    setShowPicker(false);
    try {
      const res = await communityApi.react(communityId, msgId, emoji);
      onUpdate(msgId, res.data.reactions);
    } catch {}
  }

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap relative">
      {Object.entries(grouped).map(([emoji, users]) => {
        const reacted = users.some((u) => (u._id || u) === currentUserId);
        return (
          <button key={emoji} onClick={() => handleReact(emoji)}
            className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition
              ${reacted ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-[var(--bg-surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"}`}>
            {emoji} <span>{users.length}</span>
          </button>
        );
      })}
      <button onClick={() => setShowPicker((p) => !p)}
        className="text-xs px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-2)] transition">
        +
      </button>
      {showPicker && (
        <div className="absolute bottom-7 left-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg flex gap-1 p-2 z-10">
          {EMOJI_LIST.map((e) => (
            <button key={e} onClick={() => handleReact(e)}
              className="text-lg hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Single message bubble

function MessageBubble({ msg, communityId, currentUserId, currentUserRole, onReactionUpdate, onDelete }) {
  const isOwn = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
  const sender = msg.senderId;
  const canDelete = isOwn || currentUserRole === "admin";

  return (
    <div className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 mt-1">
        {sender?.name?.[0]?.toUpperCase() || "?"}
      </div>

      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        {/* Sender info */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-semibold text-[var(--text-primary)]">{sender?.name || "Unknown"}</span>
            <RoleBadge role={sender?.role} />
          </div>
        )}

        {/* Bubble + delete button */}
        <div className="flex items-start gap-1">
          {canDelete && isOwn && (
            <button onClick={() => onDelete(msg._id)}
              className="opacity-0 group-hover:opacity-100 transition text-[var(--text-faint)] hover:text-red-400 text-xs mt-2 shrink-0">
              🗑
            </button>
          )}
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
            ${isOwn
              ? "bg-indigo-600 text-white rounded-tr-sm"
              : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm shadow-sm"
            }`}>
            {msg.text}
          </div>
          {canDelete && !isOwn && (
            <button onClick={() => onDelete(msg._id)}
              className="opacity-0 group-hover:opacity-100 transition text-[var(--text-faint)] hover:text-red-400 text-xs mt-2 shrink-0">
              🗑
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 px-1">{formatTime(msg.createdAt)}</span>

        {/* Reactions */}
        <ReactionBar
          communityId={communityId}
          msgId={msg._id}
          reactions={msg.reactions || []}
          currentUserId={currentUserId}
          onUpdate={onReactionUpdate}
        />
      </div>
    </div>
  );
}

//  Date separator 

function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
      <span className="text-xs text-[var(--text-muted)] font-medium px-2">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-[var(--bg-surface-2)]" />
    </div>
  );
}

//  Main CommunityPage 

export default function CommunityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstUnreadAt, setFirstUnreadAt] = useState(null);
  const [jumpedToUnread, setJumpedToUnread] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const latestTsRef = useRef(null); // tracks latest message timestamp for polling

  const canSend = user?.role === "admin" || user?.role === "recruiter";

  //  Load community info 
  useEffect(() => {
    communityApi.getById(id)
      .then((res) => setCommunity(res.data.community))
      .catch(() => navigate("/community"));
  }, [id, navigate]);

  //  Mark seen + get first unread 
  useEffect(() => {
    communityApi.markSeen(id).catch(() => {});
    communityApi.getFirstUnread(id)
      .then((res) => setFirstUnreadAt(res.data.firstUnreadAt))
      .catch(() => {});
  }, [id]);

  //  Initial load: latest 30 messages 
  useEffect(() => {
    communityApi.getMessages(id, { limit: 30 })
      .then((res) => {
        const msgs = res.data.messages;
        setMessages(msgs);
        if (msgs.length < 30) setHasMore(false);
        if (msgs.length > 0) {
          latestTsRef.current = msgs[msgs.length - 1].createdAt;
        }
      })
      .catch(() => setError("Failed to load messages."));
  }, [id]);

  //  Scroll to bottom on initial load 
  useEffect(() => {
    if (messages.length > 0 && !jumpedToUnread) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length > 0]); // eslint-disable-line

  //  Polling: every 10s fetch new messages 
  useEffect(() => {
    const poll = setInterval(async () => {
      if (!latestTsRef.current) return;
      try {
        const res = await communityApi.getMessages(id, { after: latestTsRef.current });
        const newMsgs = res.data.messages;
        if (newMsgs.length > 0) {
          latestTsRef.current = newMsgs[newMsgs.length - 1].createdAt;
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const fresh = newMsgs.filter((m) => !existingIds.has(m._id));
            return [...prev, ...fresh];
          });
          // Auto-scroll to bottom if user is near bottom
          const el = bottomRef.current?.parentElement;
          if (el) {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
          // Mark seen again since new messages arrived
          communityApi.markSeen(id).catch(() => {});
        }
      } catch {}
    }, 10_000);
    return () => clearInterval(poll);
  }, [id]);

  //  Load older messages 
  async function loadMore() {
    if (!messages.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0].createdAt;
      const res = await communityApi.getMessages(id, { before: oldest, limit: 30 });
      const older = res.data.messages;
      if (older.length < 30) setHasMore(false);
      setMessages((prev) => [...older, ...prev]);
    } catch {}
    finally { setLoadingMore(false); }
  }

  //  Send message 
  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await communityApi.sendMessage(id, text.trim());
      const newMsg = res.data.message;
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        if (existingIds.has(newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      latestTsRef.current = newMsg.createdAt;
      setText("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  //  Reaction update 
  const handleReactionUpdate = useCallback((msgId, reactions) => {
    setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, reactions } : m));
  }, []);

  //  Delete message 
  const handleDelete = useCallback(async (msgId) => {
    try {
      await communityApi.deleteMessage(id, msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete message.");
    }
  }, [id]);

  //  Jump to first unread 
  function jumpToFirstUnread() {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setJumpedToUnread(true);
    }
  }

  // Render 
  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/community")}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition text-lg leading-none">←</button>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{community?.name || "Community"}</p>
            <p className="text-xs text-[var(--text-muted)]">{community?.memberCount} members · @{community?.domain}</p>
          </div>
        </div>
        <NotificationBell />
      </header>

      {/* Jump to first unread banner */}
      {firstUnreadAt && !jumpedToUnread && messages.some((m) => new Date(m.createdAt) >= new Date(firstUnreadAt)) && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-xs text-indigo-600">You have unread messages</span>
          <button onClick={jumpToFirstUnread}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
            Jump to first unread ↓
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--bg-base)]">
        {/* Load more */}
        {hasMore && (
          <div className="text-center">
            <button onClick={loadMore} disabled={loadingMore}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium disabled:opacity-50 transition">
              {loadingMore ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {error && (
          <div className="text-center text-xs text-red-500 py-2">{error}</div>
        )}

        {messages.length === 0 && !error && (
          <div className="text-center text-sm text-[var(--text-muted)] py-16">
            No messages yet. {canSend ? "Be the first to say something!" : ""}
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const showDateSep = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
          const isFirstUnread = firstUnreadAt && new Date(msg.createdAt) >= new Date(firstUnreadAt) &&
            (!prevMsg || new Date(prevMsg.createdAt) < new Date(firstUnreadAt));

          return (
            <div key={msg._id}>
              {showDateSep && <DateSeparator date={msg.createdAt} />}
              {isFirstUnread && (
                <div ref={firstUnreadRef} className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-indigo-200" />
                  <span className="text-xs text-indigo-500 font-medium px-2">New messages</span>
                  <div className="flex-1 h-px bg-indigo-200" />
                </div>
              )}
              <MessageBubble
                msg={msg}
                communityId={id}
                currentUserId={user?._id}
                currentUserRole={user?.role}
                onReactionUpdate={handleReactionUpdate}
                onDelete={handleDelete}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-[var(--bg-surface)] border-t border-[var(--border)] px-4 py-3 shrink-0">
        {canSend ? (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
              }}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
              maxLength={2000}
              rows={1}
              className="flex-1 border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: "42px" }}
            />
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-[var(--text-faint)]">{text.length}/2000</span>
              <button type="submit" disabled={!text.trim() || sending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                {sending ? "..." : "Send"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-center text-[var(--text-muted)] py-1">
            You can react to messages but cannot send in this community.
          </p>
        )}
      </div>
    </div>
  );
}
