import { useState, useEffect, useCallback } from "react";
import { communityApi } from "../api/community";

/**
 * Polls /notifications/unread-count every 60 seconds.
 * Returns { total, breakdown, refresh }
 */
export function useNotifications() {
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const fetch = useCallback(async () => {
    try {
      const res = await communityApi.getUnreadCount();
      setTotal(res.data.total);
      setBreakdown(res.data.breakdown);
    } catch {
      // silent — don't break UI if this fails
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { total, breakdown, refresh: fetch };
}
