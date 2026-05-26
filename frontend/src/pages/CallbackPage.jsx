// ── CallbackPage.jsx ──
// Amplify handles the OAuth code exchange automatically.
// This page just shows a spinner while that happens, then redirects.
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function CallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Give Amplify time to process the code exchange
    const t = setTimeout(() => navigate("/", { replace: true }), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", paddingTop: "4rem" }}>
      <p>Signing you in…</p>
    </div>
  );
}