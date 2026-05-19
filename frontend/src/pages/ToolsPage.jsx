import { useState } from "react";
import { tools, serverTools } from "../utils/clientTools.js";
import { callTool } from "../utils/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { saveSnippet } from "../utils/api.js";

export function ToolsPage() {
  const [selected, setSelected] = useState("base64-encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const { user, getToken } = useAuth();

  const isServer = serverTools.includes(selected);
  const toolDef = tools[selected];

  async function run() {
    if (isServer) {
      try {
        const data = await callTool({ tool: selected, input: { token: input, pem: input } });
        setOutput(JSON.stringify(data.result, null, 2));
      } catch (e) {
        setOutput(`Error: ${e.message}`);
      }
    } else {
      setOutput(toolDef.run(input));
    }
  }

  async function handleSave() {
    if (!user) return alert("Sign in to save snippets");
    setSaving(true);
    try {
      const token = await getToken();
      await saveSnippet(token, { tool: selected, input, output });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch {
      setSaveMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: "1.5rem" }}>DevTools</h1>

      {/* Tool selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {Object.entries(tools).map(([key, t]) => (
          <button
            key={key}
            onClick={() => { setSelected(key); setInput(""); setOutput(""); }}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: selected === key ? "#1a1a2e" : "#f5f5f5",
              color: selected === key ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {t.label}
          </button>
        ))}
        {/* Server-side tool buttons */}
        {[
          { key: "jwt-verify", label: "JWT verify ⚡" },
          { key: "cert-parse", label: "Cert parser ⚡" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSelected(key); setInput(""); setOutput(""); }}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: 6,
              border: "1px solid #7c3aed",
              background: selected === key ? "#7c3aed" : "#f5f0ff",
              color: selected === key ? "#fff" : "#7c3aed",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {isServer && (
        <p style={{ fontSize: 13, color: "#7c3aed", marginBottom: "0.75rem" }}>
          ⚡ Runs server-side via Lambda
        </p>
      )}

      {/* Input */}
      <label style={{ display: "block", fontWeight: 500, marginBottom: "0.4rem" }}>
        {toolDef?.inputLabel ?? "Input"}
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 13, padding: "0.6rem", borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" }}
        placeholder="Paste your input here…"
      />

      <div style={{ display: "flex", gap: "0.75rem", margin: "0.75rem 0" }}>
        <button
          onClick={run}
          style={{ padding: "0.5rem 1.5rem", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 }}
        >
          Run
        </button>
        {output && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "0.5rem 1rem", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", borderRadius: 6, cursor: "pointer" }}
          >
            {saving ? "Saving…" : "Save snippet"}
          </button>
        )}
        {saveMsg && <span style={{ alignSelf: "center", fontSize: 13, color: "#166534" }}>{saveMsg}</span>}
      </div>

      {/* Output */}
      {output && (
        <>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.4rem" }}>Output</label>
          <textarea
            readOnly
            value={output}
            rows={8}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 13, padding: "0.6rem", borderRadius: 6, border: "1px solid #ccc", background: "#fafafa", boxSizing: "border-box" }}
          />
          <button
            onClick={() => navigator.clipboard.writeText(output)}
            style={{ marginTop: "0.4rem", padding: "0.3rem 0.75rem", fontSize: 13, background: "transparent", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
          >
            Copy
          </button>
        </>
      )}
    </div>
  );
}
