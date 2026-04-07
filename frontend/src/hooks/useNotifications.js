import { useState, useEffect, useCallback } from "react";
import { communityApi } from "../api/community";
import { useAuth } from "../context/AuthContext";

/**
 * Polls /notifications/unread-count every 60 seconds.
 * Only runs when user is logged in.
 * Returns { total, breakdown, refresh }
 */
export function useNotifications() {
  const { user } = useAuth();
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await communityApi.getUnreadCount();
      setTotal(res.data.total);
      setBreakdown(res.data.breakdown);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchCount]);

  // Reset when user logs out
  useEffect(() => {
    if (!user) { setTotal(0); setBreakdown([]); }
  }, [user]);

  return { total, breakdown, refresh: fetchCount };
}
