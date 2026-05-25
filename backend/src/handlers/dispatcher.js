import { toolHandlers } from "./tools.js";
import { getSnippets, saveSnippet } from "./snippets.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Content-Type": "application/json",
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function getUserId(event) {
  // API Gateway injects the Cognito claims when the Cognito authorizer is used
  return event.requestContext?.authorizer?.claims?.sub ?? null;
}

export const handler = async (event) => {
  const method = event.httpMethod;
  const path = event.resource; // e.g. "/tools" or "/snippets"

  try {
    // ── /tools POST — no auth required ──
    if (path === "/tools" && method === "POST") {
      const { tool, input } = JSON.parse(event.body ?? "{}");

      if (!tool || !toolHandlers[tool]) {
        return response(400, { error: `Unknown tool: ${tool}` });
      }

      const result = await toolHandlers[tool](input);
      return response(200, { tool, result });
    }

    // ── /snippets GET — auth required ──
    if (path === "/snippets" && method === "GET") {
      const userId = getUserId(event);
      if (!userId) return response(401, { error: "Unauthorized" });

      const snippets = await getSnippets(userId);
      return response(200, { snippets });
    }

    // ── /snippets POST — auth required ──
    if (path === "/snippets" && method === "POST") {
      const userId = getUserId(event);
      if (!userId) return response(401, { error: "Unauthorized" });

    const clientSideTools = ["base64-encode", "base64-decode", "url-encode", "url-decode", "jwt-inspect", "json-format", "regex-test", "unix-timestamp"];

    if (!tool) {
      return response(400, { error: "tool is required" });
    }
    if (clientSideTools.includes(tool)) {
      return response(400, { error: `${tool} runs client-side — do not call the API for this tool` });
    }
    if (!toolHandlers[tool]) {
      return response(400, { error: `Unknown tool: ${tool}. Available: ${Object.keys(toolHandlers).join(", ")}` });
    }
      const snippet = await saveSnippet({ userId, tool, input, output, label });
      return response(201, { snippet });
    }

    return response(404, { error: "Not found" });
  } catch (err) {
    console.error("Dispatcher error:", err);
    return response(500, { error: "Internal server error" });
  }
};
