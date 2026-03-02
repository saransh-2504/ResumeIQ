import { env } from "../config/env";

export async function get(path) {
  const res = await fetch(`${env.API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}