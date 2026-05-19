// All of these run client-side — zero latency, no Lambda needed.

export const tools = {
  "base64-encode": {
    label: "Base64 encode",
    inputLabel: "Plain text",
    run: (input) => btoa(unescape(encodeURIComponent(input))),
  },
  "base64-decode": {
    label: "Base64 decode",
    inputLabel: "Base64 string",
    run: (input) => {
      try {
        return decodeURIComponent(escape(atob(input.trim())));
      } catch {
        return "Error: invalid Base64 input";
      }
    },
  },
  "url-encode": {
    label: "URL encode",
    inputLabel: "Plain text",
    run: (input) => encodeURIComponent(input),
  },
  "url-decode": {
    label: "URL decode",
    inputLabel: "Encoded URL",
    run: (input) => {
      try {
        return decodeURIComponent(input);
      } catch {
        return "Error: invalid URL encoding";
      }
    },
  },
  "jwt-inspect": {
    label: "JWT inspect",
    inputLabel: "JWT token",
    run: (input) => {
      const parts = input.trim().split(".");
      if (parts.length !== 3) return "Error: not a valid JWT (expected 3 parts)";
      try {
        const decode = (s) =>
          JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
        return JSON.stringify(
          { header: decode(parts[0]), payload: decode(parts[1]) },
          null,
          2
        );
      } catch {
        return "Error: could not decode JWT parts";
      }
    },
  },
  "json-format": {
    label: "JSON format",
    inputLabel: "JSON string",
    run: (input) => {
      try {
        return JSON.stringify(JSON.parse(input), null, 2);
      } catch (e) {
        return `Error: ${e.message}`;
      }
    },
  },
  "regex-test": {
    label: "Regex tester",
    inputLabel: "pattern:::test string (split by :::)",
    run: (input) => {
      const [pattern, ...rest] = input.split(":::");
      const testStr = rest.join(":::");
      if (!testStr) return "Format: pattern:::test string";
      try {
        const rx = new RegExp(pattern, "g");
        const matches = [...testStr.matchAll(rx)];
        if (!matches.length) return "No matches";
        return matches
          .map((m, i) => `Match ${i + 1}: "${m[0]}" at index ${m.index}`)
          .join("\n");
      } catch (e) {
        return `Regex error: ${e.message}`;
      }
    },
  },
  "unix-timestamp": {
    label: "Unix timestamp",
    inputLabel: "Timestamp (leave empty for now)",
    run: (input) => {
      const ts = input.trim() ? Number(input.trim()) : Date.now() / 1000;
      if (isNaN(ts)) return "Error: not a number";
      const d = new Date(ts * 1000);
      return [
        `UTC:   ${d.toUTCString()}`,
        `ISO:   ${d.toISOString()}`,
        `Local: ${d.toLocaleString()}`,
        `Unix:  ${Math.floor(ts)}`,
      ].join("\n");
    },
  },
};

// Server-side tools (routed via Lambda)
export const serverTools = ["jwt-verify", "cert-parse"];
