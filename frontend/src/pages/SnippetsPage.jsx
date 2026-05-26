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

  if (loading) return (
    <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
      <p>Loading your profile…</p>
    </div>
  );

  if (!user) {
    return (
      <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", background: "#fff", padding: "3rem", borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <h1 style={{ marginBottom: "1rem", color: "#1e293b" }}>Saved Snippets</h1>
        <p style={{ color: "#475569", marginBottom: "2rem" }}>Sign in with your AWS Cognito account to view your saved infrastructure tools and history.</p>
        <button
          onClick={() => signInWithRedirect()}
          style={{ padding: "0.6rem 2rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 15 }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, color: "#1e293b" }}>Snippet History</h1>
        <span style={{ fontSize: 14, color: "#64748b" }}>{snippets.length} saved</span>
      </div>

      {fetching && <p style={{ color: "#64748b", textAlign: "center" }}>Loading snippets from DynamoDB…</p>}

      {!fetching && snippets.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: 12, border: "1px dashed #cbd5e1" }}>
          <p style={{ color: "#64748b", margin: 0 }}>No snippets yet — run a tool and hit "Save to History".</p>
        </div>
      )}

      {/* Render Snippet Cards */}
      {snippets.map((s) => (
        <div key={s.snippetId} style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)", border: "1px solid #e2e8f0" }}>

          {/* Card Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <strong style={{ fontSize: 16, color: "#1e293b", textTransform: "capitalize" }}>
                {s.tool.replace("-", " ")}
              </strong>
              <span style={{ fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "0.2rem 0.6rem", borderRadius: 12 }}>
                ID: {s.snippetId.split("-")[0]}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              {new Date(s.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Dual Pane Workspaces */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Input Section */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Input</label>
              <pre style={{ margin: "0.25rem 0 0 0", fontSize: 13, background: "#f8fafc", color: "#334155", padding: "0.75rem", borderRadius: 8, overflowX: "auto", border: "1px solid #e2e8f0", fontFamily: "Menlo, Monaco, monospace" }}>
                {s.input}
              </pre>
            </div>

            {/* Output Section (Only renders if an output exists) */}
            {s.output && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.5px" }}>Output</label>
                <pre style={{ margin: "0.25rem 0 0 0", fontSize: 13, background: "#1e293b", color: "#e2e8f0", padding: "0.75rem", borderRadius: 8, overflowX: "auto", fontFamily: "Menlo, Monaco, monospace" }}>
                  {s.output}
                </pre>
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  );
}