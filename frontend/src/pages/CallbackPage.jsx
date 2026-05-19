// ── CallbackPage.jsx ──
// Amplify handles the OAuth code exchange automatically.
// This page just shows a spinner while that happens, then redirects.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function CallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    // Give Amplify a moment to process the code exchange, then redirect
    const t = setTimeout(() => navigate("/", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", paddingTop: "4rem" }}>
      <p>Signing you in…</p>
    </div>
  );
}
