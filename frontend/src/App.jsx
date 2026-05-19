import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Amplify } from "aws-amplify";
import { amplifyConfig } from "./config.js";
import { ToolsPage } from "./pages/ToolsPage.jsx";
import { SnippetsPage } from "./pages/SnippetsPage.jsx";
import { CallbackPage } from "./pages/CallbackPage.jsx";
import { Navbar } from "./components/Navbar.jsx";

Amplify.configure(amplifyConfig);

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        <Routes>
          <Route path="/" element={<ToolsPage />} />
          <Route path="/snippets" element={<SnippetsPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
