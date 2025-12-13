from fastapi import APIRouter
from fastapi.responses import HTMLResponse


def build_dev_router() -> APIRouter:
    """Expose lightweight development pages served directly by FastAPI."""

    router = APIRouter(prefix="/dev", tags=["dev"])

    @router.get("/chat", response_class=HTMLResponse)
    def chat_dev_page():
        return HTMLResponse(content=_CHAT_DEV_HTML)

    @router.get("/concept-graph", response_class=HTMLResponse)
    def concept_graph_page():
        return HTMLResponse(content=_CONCEPT_GRAPH_HTML)

    return router


_CHAT_DEV_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chat Dev Console</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --fg: #0f172a;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #cbd5f5;
      --accent: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --fg: #e2e8f0;
        --bg: #020617;
        --card: #0f172a;
        --border: #1e293b;
        --accent: #38bdf8;
      }
    }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--fg);
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: clamp(1.6rem, 3vw, 2.4rem);
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
    }
    .controls, .send-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-end;
    }
    label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.8;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    input, textarea {
      width: 100%;
      padding: 0.65rem 0.8rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-family: inherit;
      font-size: 0.95rem;
      background: var(--bg);
      color: inherit;
    }
    textarea {
      min-height: 120px;
      resize: vertical;
    }
    button {
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 0.65rem 1.5rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
      height: fit-content;
    }
    button.secondary {
      background: transparent;
      color: inherit;
      border: 1px solid var(--border);
    }
    button:disabled {
      opacity: 0.5;
      cursor: wait;
    }
    button:not(:disabled):hover {
      transform: translateY(-1px);
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .status {
      min-height: 1.2rem;
      font-size: 0.9rem;
      color: var(--accent);
      margin-top: 0.35rem;
    }
    .status.error {
      color: #f97316;
    }
    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }
    .messages {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 420px;
      overflow-y: auto;
    }
    .message {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.75rem 0.9rem;
    }
    .message h4 {
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
      text-transform: capitalize;
    }
    .message pre {
      margin: 0.4rem 0 0;
    }
    pre {
      background: rgba(15, 23, 42, 0.04);
      border-radius: 12px;
      padding: 1rem;
      overflow-x: auto;
      border: 1px solid var(--border);
      font-size: 0.85rem;
      white-space: pre-wrap;
    }
    .checkbox {
      flex-direction: row;
      align-items: center;
      gap: 0.35rem;
      text-transform: none;
      letter-spacing: normal;
      opacity: 1;
    }
    .checkbox input {
      width: auto;
    }
    small {
      opacity: 0.75;
    }
    .link {
      color: var(--accent);
      text-decoration: none;
      font-weight: 600;
    }
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <p class="pill">Internal · dev only</p>
      <h1>Chat Dev Console</h1>
      <p>Exercise the chat API without Postman. Create sessions, send prompts, and inspect the persisted transcript.</p>
      <p><a class="link" href="/dev/concept-graph">View concept graph builder →</a></p>
    </header>

    <section class="card">
      <div class="controls">
        <label style="flex:2;">
          Session ID
          <input id="session-id" placeholder="uuid …" />
        </label>
        <button id="create-session">Create session</button>
        <button class="secondary" id="load-session">Load session</button>
      </div>
      <small id="session-meta"></small>
      <p class="status" id="status"></p>
    </section>

    <section class="card">
      <div class="field-grid">
        <label>
          User message
          <textarea id="user-text" placeholder="Say something to the assistant…"></textarea>
        </label>
        <label>
          System prompt (optional)
          <textarea id="system-prompt" placeholder="Override the system instructions for this turn"></textarea>
        </label>
      </div>
      <div class="send-controls">
        <label class="checkbox"><input type="checkbox" id="persist" checked /> Persist to store</label>
        <label style="min-width:180px;">
          Model (optional)
          <input id="model" placeholder="gpt-4o-mini" />
        </label>
        <button id="send-message">Send to /generate</button>
      </div>
    </section>

    <section class="card conversation">
      <h2>Conversation</h2>
      <div id="messages" class="messages"></div>
    </section>

    <section class="card">
      <h2>Latest assistant response</h2>
      <pre id="assistant-output">Send a message to see the assistant output here.</pre>
    </section>
  </div>

  <script>
    const sessionIdInput = document.getElementById("session-id");
    const createBtn = document.getElementById("create-session");
    const loadBtn = document.getElementById("load-session");
    const sendBtn = document.getElementById("send-message");
    const statusEl = document.getElementById("status");
    const sessionMeta = document.getElementById("session-meta");
    const messagesEl = document.getElementById("messages");
    const userInput = document.getElementById("user-text");
    const systemPromptInput = document.getElementById("system-prompt");
    const persistInput = document.getElementById("persist");
    const modelInput = document.getElementById("model");
    const assistantOutput = document.getElementById("assistant-output");

    function setStatus(message, isError = false) {
      statusEl.textContent = message || "";
      statusEl.classList.toggle("error", Boolean(isError));
    }

    function toggleBusy(isBusy) {
      [createBtn, loadBtn, sendBtn].forEach((btn) => {
        btn.disabled = isBusy;
      });
    }

    function renderMessages(messages) {
      messagesEl.innerHTML = "";
      if (!messages.length) {
        messagesEl.innerHTML = "<p>No messages yet. Create a session and send one!</p>";
        return;
      }
      messages.forEach((msg) => {
        const article = document.createElement("article");
        article.className = "message";
        const ts = new Date(msg.ts * 1000).toLocaleString();
        article.innerHTML = `
          <h4>${msg.role}</h4>
          <small>${ts} · ${msg.id}</small>
          <pre>${msg.content}</pre>
        `;
        messagesEl.appendChild(article);
      });
    }

    async function createSession() {
      try {
        toggleBusy(true);
        setStatus("Creating session…");
        const res = await fetch("/v1/chat/sessions", { method: "POST" });
        if (!res.ok) {
          throw new Error("Failed to create session (" + res.status + ")");
        }
        const data = await res.json();
        sessionIdInput.value = data.session_id;
        await loadSession({ silent: true });
        setStatus("Session created.");
      } catch (err) {
        setStatus(err.message || "Unable to create session.", true);
      } finally {
        toggleBusy(false);
      }
    }

    async function loadSession(options = {}) {
      const sessionId = sessionIdInput.value.trim();
      if (!sessionId) {
        if (!options.silent) {
          setStatus("Provide a session ID first.", true);
        }
        return null;
      }
      try {
        toggleBusy(true);
        if (!options.silent) {
          setStatus("Fetching session…");
        }
        const res = await fetch(`/v1/chat/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to load session (" + res.status + ")");
        }
        const data = await res.json();
        renderMessages(data.messages || []);
        sessionMeta.textContent = `Created ${new Date(
          data.created_ts * 1000
        ).toLocaleString()} · ${data.messages.length} messages`;
        if (!options.silent) {
          setStatus("Session loaded.");
        } else {
          setStatus("");
        }
        return data;
      } catch (err) {
        renderMessages([]);
        sessionMeta.textContent = "";
        setStatus(err.message || "Unable to fetch session.", true);
        return null;
      } finally {
        toggleBusy(false);
      }
    }

    async function sendMessage() {
      const sessionId = sessionIdInput.value.trim();
      if (!sessionId) {
        setStatus("Provide a session ID first.", true);
        return;
      }
      const content = userInput.value.trim();
      if (!content) {
        setStatus("Enter a user message before sending.", true);
        return;
      }

      const payload = {
        content,
        persist: persistInput.checked,
      };
      const systemPrompt = systemPromptInput.value.trim();
      if (systemPrompt) {
        payload.system_prompt = systemPrompt;
      }
      const model = modelInput.value.trim();
      if (model) {
        payload.model = model;
      }

      try {
        toggleBusy(true);
        setStatus("Calling /generate…");
        const res = await fetch(`/v1/chat/sessions/${sessionId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("Generate failed (" + res.status + ")");
        }
        const data = await res.json();
        assistantOutput.textContent = data.content || "(empty response)";
        userInput.value = "";
        await loadSession({ silent: true });
        setStatus("Assistant responded.");
      } catch (err) {
        setStatus(err.message || "Unable to generate response.", true);
      } finally {
        toggleBusy(false);
      }
    }

    createBtn.addEventListener("click", createSession);
    loadBtn.addEventListener("click", () => loadSession({ silent: false }));
    sendBtn.addEventListener("click", sendMessage);
  </script>
</body>
</html>
"""

_CONCEPT_GRAPH_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Concept Graph Inspector</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --fg: #0f172a;
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #cbd5f5;
      --accent: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --fg: #e2e8f0;
        --bg: #020617;
        --card: #0f172a;
        --border: #1e293b;
        --accent: #38bdf8;
      }
    }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--fg);
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: clamp(1.6rem, 3vw, 2.4rem);
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
    }
    label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.8;
    }
    input, select {
      width: 100%;
      padding: 0.65rem 0.8rem;
      margin-top: 0.25rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      font-family: inherit;
      font-size: 0.95rem;
      background: var(--bg);
      color: inherit;
    }
    button {
      background: var(--accent);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 0.65rem 1.5rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    button.secondary {
      background: transparent;
      color: inherit;
      border: 1px solid var(--border);
    }
    button:disabled {
      opacity: 0.5;
      cursor: wait;
    }
    button:not(:disabled):hover {
      transform: translateY(-1px);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    pre {
      background: rgba(15, 23, 42, 0.04);
      border-radius: 12px;
      padding: 1rem;
      overflow-x: auto;
      border: 1px solid var(--border);
      font-size: 0.85rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.75rem;
      font-size: 0.95rem;
    }
    th, td {
      text-align: left;
      padding: 0.35rem 0.25rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.3);
    }
    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.75;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.8rem;
    }
    .metric {
      padding: 0.9rem 1rem;
      border-radius: 14px;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
    }
    .metric span {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.7;
    }
    .metric strong {
      font-size: 1.4rem;
    }
    .status {
      min-height: 1.2rem;
      font-size: 0.9rem;
      color: var(--accent);
    }
    .error {
      color: #f97316;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 320px;
      overflow-y: auto;
    }
    .item {
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.75rem 0.9rem;
    }
    .item h4 {
      margin: 0;
      font-size: 1rem;
    }
    .item p {
      margin: 0.35rem 0 0;
      font-size: 0.85rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <p class="pill">Internal · dev only</p>
      <h1>Concept Graph Inspector</h1>
      <p>Trigger incremental/full graph builds for any chat session and examine the resulting structure without leaving the backend module.</p>
    </header>

    <section class="card">
      <div class="controls">
        <label style="flex:2;">
          Session ID
          <input id="session-id" placeholder="uuid ..." />
        </label>
        <label style="flex:1;">
          Mode
          <select id="mode">
            <option value="incremental">Incremental</option>
            <option value="full">Full rebuild</option>
          </select>
        </label>
        <div style="display:flex; gap:0.5rem;">
          <button id="build-btn">Build</button>
          <button class="secondary" id="refresh-btn">Refresh</button>
        </div>
      </div>
      <p class="status" id="status"></p>
    </section>

    <section class="grid">
      <div class="metric"><span>Concepts</span><strong id="concept-count">0</strong></div>
      <div class="metric"><span>Edges</span><strong id="edge-count">0</strong></div>
      <div class="metric"><span>Last processed index</span><strong id="last-index">n/a</strong></div>
    </section>

    <section class="card">
      <h2>Graph overview</h2>
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:.5rem;">
        <small>Graph version <strong id="graph-version">-</strong></small>
        <small>Updated <strong id="updated-ts">n/a</strong></small>
      </div>
      <pre id="graph-json">{}</pre>
    </section>

    <section class="card" style="display:grid; gap:1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
      <div>
        <h3>Concepts</h3>
        <div id="concept-list" class="list"></div>
      </div>
      <div>
        <h3>Edges</h3>
        <div id="edge-list" class="list"></div>
      </div>
    </section>
  </div>

  <script>
    const buildBtn = document.getElementById("build-btn");
    const refreshBtn = document.getElementById("refresh-btn");
    const sessionInput = document.getElementById("session-id");
    const modeSelect = document.getElementById("mode");
    const statusEl = document.getElementById("status");
    const conceptCount = document.getElementById("concept-count");
    const edgeCount = document.getElementById("edge-count");
    const lastIndex = document.getElementById("last-index");
    const graphVersion = document.getElementById("graph-version");
    const updatedTs = document.getElementById("updated-ts");
    const graphJson = document.getElementById("graph-json");
    const conceptList = document.getElementById("concept-list");
    const edgeList = document.getElementById("edge-list");

    function setLoading(isLoading, message) {
      buildBtn.disabled = isLoading;
      refreshBtn.disabled = isLoading;
      statusEl.textContent = message || "";
      statusEl.classList.toggle("error", false);
    }

    function setError(message) {
      statusEl.textContent = message;
      statusEl.classList.add("error");
    }

    function updateSummary(data) {
      conceptCount.textContent = data.concepts.length;
      edgeCount.textContent = data.edges.length;
      lastIndex.textContent =
        data.meta.last_processed_index >= 0
          ? data.meta.last_processed_index
          : "n/a";
      graphVersion.textContent = data.meta.graph_version || "-";
      updatedTs.textContent = data.meta.updated_ts
        ? new Date(data.meta.updated_ts * 1000).toLocaleString()
        : "n/a";
    }

    function renderJson(data) {
      graphJson.textContent = JSON.stringify(data, null, 2);
    }

    function renderLists(data) {
      conceptList.innerHTML = "";
      if (data.concepts.length === 0) {
        conceptList.innerHTML = "<p>No concepts extracted yet.</p>";
      } else {
        data.concepts.forEach((concept) => {
          const el = document.createElement("article");
          el.className = "item";
          el.innerHTML = `
            <h4>${concept.label}</h4>
            <p>${concept.summary || "—"}</p>
            <p><small>Type: ${concept.type || "concept"} · Seen ${concept.first_seen_index} → ${concept.last_seen_index}</small></p>
            ${
              concept.aliases && concept.aliases.length
                ? `<p><small>Aliases: ${concept.aliases.join(", ")}</small></p>`
                : ""
            }
          `;
          conceptList.appendChild(el);
        });
      }

      edgeList.innerHTML = "";
      if (data.edges.length === 0) {
        edgeList.innerHTML = "<p>No edges recorded for this graph.</p>";
      } else {
        data.edges.forEach((edge) => {
          const el = document.createElement("article");
          el.className = "item";
          el.innerHTML = `
            <h4>${edge.relation}</h4>
            <p><small>${edge.from_concept_id} → ${edge.to_concept_id}</small></p>
            <p><small>Introduced at index ${edge.introduced_index}</small></p>
            ${edge.evidence_snippet ? `<p>${edge.evidence_snippet}</p>` : ""}
          `;
          edgeList.appendChild(el);
        });
      }
    }

    async function fetchGraph(url, options) {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error("Request failed with status " + res.status);
      }
      return res.json();
    }

    async function handleBuild() {
      const sessionId = sessionInput.value.trim();
      if (!sessionId) {
        setError("Provide a session ID.");
        return;
      }
      try {
        setLoading(true, "Building graph…");
        const data = await fetchGraph(
          `/v1/chat/sessions/${sessionId}/concept-graph/build`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: modeSelect.value }),
          }
        );
        updateSummary(data);
        renderJson(data);
        renderLists(data);
        setLoading(false, "Build complete.");
      } catch (err) {
        setLoading(false, "");
        setError(err.message || "Failed to build graph.");
      }
    }

    async function handleRefresh() {
      const sessionId = sessionInput.value.trim();
      if (!sessionId) {
        setError("Provide a session ID.");
        return;
      }
      try {
        setLoading(true, "Fetching existing graph…");
        const data = await fetchGraph(`/v1/chat/sessions/${sessionId}/concept-graph`);
        updateSummary(data);
        renderJson(data);
        renderLists(data);
        setLoading(false, "Snapshot refreshed.");
      } catch (err) {
        setLoading(false, "");
        setError(err.message || "Failed to fetch graph.");
      }
    }

    buildBtn.addEventListener("click", handleBuild);
    refreshBtn.addEventListener("click", handleRefresh);
  </script>
</body>
</html>
"""
