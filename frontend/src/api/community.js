import api from "./axios";

export const communityApi = {
  discover: () => api.get("/community/discover"),
  getById: (id) => api.get(`/community/${id}`),
  getMembers: (id) => api.get(`/community/${id}/members`),
  join: (id) => api.post(`/community/${id}/join`),

  // Pagination: latest 30, or older via ?before=<ts>
  getMessages: (id, params = {}) => api.get(`/community/${id}/messages`, { params }),
  sendMessage: (id, text) => api.post(`/community/${id}/messages`, { text }),
  react: (id, msgId, emoji) => api.post(`/community/${id}/messages/${msgId}/react`, { emoji }),

  // Notifications
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markSeen: (communityId) => api.post(`/notifications/${communityId}/seen`),
  getFirstUnread: (communityId) => api.get(`/notifications/${communityId}/first-unread`),
};
