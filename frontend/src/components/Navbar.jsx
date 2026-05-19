import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { signInWithRedirect } from "aws-amplify/auth";

export function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.75rem 1.5rem",
      borderBottom: "1px solid #e5e7eb",
      background: "#1a1a2e",
      color: "#fff",
    }}>
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 18 }}>
          DevTools
        </Link>
        <Link to="/" style={{ color: "#cbd5e1", textDecoration: "none", fontSize: 14 }}>Tools</Link>
        <Link to="/snippets" style={{ color: "#cbd5e1", textDecoration: "none", fontSize: 14 }}>Snippets</Link>
      </div>

      <div>
        {loading ? null : user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{user.username}</span>
            <button
              onClick={logout}
              style={{ padding: "0.35rem 0.85rem", background: "transparent", border: "1px solid #475569", color: "#e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithRedirect()}
            style={{ padding: "0.35rem 0.85rem", background: "#7c3aed", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
