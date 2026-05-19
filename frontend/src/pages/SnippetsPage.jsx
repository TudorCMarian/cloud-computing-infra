// ── SnippetsPage.jsx ──
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { fetchSnippets } from "../utils/api.js";
import { signInWithRedirect } from "aws-amplify/auth";

export function SnippetsPage() {
  const { user, loading, getToken } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    getToken()
      .then((token) => fetchSnippets(token))
      .then((data) => setSnippets(data.snippets ?? []))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading) return <p>Loading…</p>;

  if (!user) {
    return (
      <div>
        <h1>Saved snippets</h1>
        <p>Sign in to view your saved snippets.</p>
        <button
          onClick={() => signInWithRedirect()}
          style={{ padding: "0.5rem 1.25rem", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>Saved snippets</h1>
      {fetching && <p>Loading snippets…</p>}
      {!fetching && snippets.length === 0 && <p style={{ color: "#888" }}>No snippets yet — run a tool and hit "Save snippet".</p>}
      {snippets.map((s) => (
        <div key={s.snippetId} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <strong style={{ fontSize: 14 }}>{s.label}</strong>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{new Date(s.createdAt).toLocaleString()}</span>
          </div>
          <pre style={{ margin: 0, fontSize: 12, background: "#f9fafb", padding: "0.5rem", borderRadius: 6, overflowX: "auto" }}>
            {s.input}
          </pre>
        </div>
      ))}
    </div>
  );
}
