import { useState } from "react";
import { tools, serverTools } from "../utils/clientTools.js";
import { callTool } from "../utils/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { saveSnippet } from "../utils/api.js";

const serverToolConfigs = {
  "jwt-verify": { label: "JWT verify", inputLabel: "JWT Token" },
  "cert-parse": { label: "Cert parser", inputLabel: "PEM Certificate" },
  "cron-translate": { label: "Cron Translate", inputLabel: "Cron Expression (e.g., 0 4 * * *)" },
  "json-to-yaml": { label: "JSON to YAML", inputLabel: "Valid JSON String" },
  "cidr-calc": { label: "CIDR Calculator", inputLabel: "CIDR Block (e.g., 10.0.0.0/24)" },
  "dos2unix": { label: "Dos2Unix", inputLabel: "Text to convert" }
};

export function ToolsPage() {
  const [selected, setSelected] = useState("base64-encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const { user, getToken } = useAuth();

  const isServer = serverTools.includes(selected);
  const clientToolDef = tools[selected];

  // Helper component for the sidebar buttons to keep code clean
  const TabButton = ({ toolKey, label, isServerType }) => {
    const isActive = selected === toolKey;
    const baseColor = isServerType ? "#7c3aed" : "#1a1a2e";
    const bgHover = isServerType ? "#f5f0ff" : "#f1f5f9";

    return (
      <button
        onClick={() => { setSelected(toolKey); setInput(""); setOutput(""); }}
        style={{
          textAlign: "left",
          padding: "0.6rem 1rem",
          borderRadius: 8,
          border: isActive ? `1px solid ${baseColor}` : "1px solid transparent",
          background: isActive ? baseColor : "transparent",
          color: isActive ? "#fff" : "#475569",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          transition: "all 0.2s",
          width: "100%",
        }}
        onMouseOver={(e) => { if (!isActive) e.target.style.background = bgHover; }}
        onMouseOut={(e) => { if (!isActive) e.target.style.background = "transparent"; }}
      >
        {label}
      </button>
    );
  };

  async function run() {
    if (isServer) {
      try {
        let payload = {};
        switch (selected) {
          case "jwt-verify": payload = { token: input }; break;
          case "cert-parse": payload = { pem: input }; break;
          case "cron-translate": payload = { expression: input }; break;
          case "json-to-yaml": payload = { jsonString: input }; break;
          case "cidr-calc": payload = { cidr: input }; break;
          case "dos2unix": payload = { text: input }; break;
          default: throw new Error("Unknown server tool");
        }
        const data = await callTool({ tool: selected, input: payload });
        setOutput(JSON.stringify(data.result, null, 2));
      } catch (e) {
        setOutput(`Error: ${e.message}`);
      }
    } else {
      setOutput(clientToolDef.run(input));
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
    <div style={{ display: "flex", gap: "2rem", minHeight: "80vh", alignItems: "flex-start" }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: "240px", flexShrink: 0, borderRight: "1px solid #e2e8f0", paddingRight: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Local Tools Section */}
        <div>
          <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "1px", marginBottom: "0.5rem", marginLeft: "0.5rem" }}>
            Local Tools
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {Object.entries(tools).map(([key, t]) => (
              <TabButton key={key} toolKey={key} label={t.label} isServerType={false} />
            ))}
          </div>
        </div>

        {/* Server Tools Section */}
        <div>
          <h3 style={{ fontSize: 12, textTransform: "uppercase", color: "#8b5cf6", letterSpacing: "1px", marginBottom: "0.5rem", marginLeft: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Cloud Tools ⚡
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {Object.entries(serverToolConfigs).map(([key, config]) => (
              <TabButton key={key} toolKey={key} label={config.label} isServerType={true} />
            ))}
          </div>
        </div>
      </aside>

      {/* ── CENTER WORKSPACE ── */}
      <main style={{ flex: 1, maxWidth: "800px", background: "#fff", padding: "2rem", borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, color: "#1e293b" }}>
            {isServer ? serverToolConfigs[selected].label : clientToolDef.label}
          </h2>
          {isServer && <span style={{ fontSize: 13, color: "#7c3aed", background: "#f5f0ff", padding: "0.2rem 0.6rem", borderRadius: 12 }}>Processed via AWS Lambda</span>}
        </div>

        {/* Input */}
        <label style={{ display: "block", fontWeight: 500, marginBottom: "0.5rem", color: "#475569" }}>
          {isServer ? serverToolConfigs[selected].inputLabel : clientToolDef?.inputLabel ?? "Input"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          style={{ width: "100%", fontFamily: "Menlo, Monaco, monospace", fontSize: 14, padding: "1rem", borderRadius: 8, border: "1px solid #cbd5e1", boxSizing: "border-box", background: "#f8fafc", resize: "vertical" }}
          placeholder="Paste your input here…"
        />

        {/* Action Bar */}
        <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0" }}>
          <button
            onClick={run}
            style={{ padding: "0.6rem 2rem", background: isServer ? "#7c3aed" : "#1e293b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, transition: "opacity 0.2s" }}
            onMouseOver={(e) => e.target.style.opacity = 0.9}
            onMouseOut={(e) => e.target.style.opacity = 1}
          >
            Execute Tool
          </button>

          {output && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "0.6rem 1.5rem", background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}
            >
              {saving ? "Saving to DynamoDB…" : "Save to History"}
            </button>
          )}
          {saveMsg && <span style={{ alignSelf: "center", fontSize: 14, color: "#166534", fontWeight: 500 }}>{saveMsg}</span>}
        </div>

        {/* Output */}
        {output && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ fontWeight: 500, color: "#475569" }}>Output</label>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                style={{ fontSize: 13, color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Copy to clipboard
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={10}
              style={{ width: "100%", fontFamily: "Menlo, Monaco, monospace", fontSize: 14, padding: "1rem", borderRadius: 8, border: "1px solid #e2e8f0", background: "#1e293b", color: "#e2e8f0", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>
        )}
      </main>
    </div>
  );
}