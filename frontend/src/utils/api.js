import { API_BASE } from "../config.js";

export async function callTool({ tool, input }) {
  const res = await fetch(`${API_BASE}/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function fetchSnippets(token) {
  const res = await fetch(`${API_BASE}/snippets`, {
    headers: { Authorization: token },
  });
  if (!res.ok) throw new Error("Failed to fetch snippets");
  return res.json();
}

export async function saveSnippet(token, payload) {
  const res = await fetch(`${API_BASE}/snippets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save snippet");
  return res.json();
}
