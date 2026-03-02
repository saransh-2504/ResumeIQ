export const API_BASE = import.meta.env.VITE_API_URL;

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
