# Chat Backend API (Quick Reference)

Base URL: `/v1/chat`

## Core Routes

- `POST /sessions` &mdash; start a new chat session.  
  Response:
  ```json
  { "session_id": "uuid" }
  ```

- `GET /sessions/{session_id}` &mdash; fetch stored messages + timestamps for a session.

- `POST /sessions/{session_id}/generate` &mdash; append a user turn and stream it through the configured LLM.  
  Request body:
  ```json
  {
    "content": "user text",
    "system_prompt": "optional override"(optional),
    "persist": true,
    "model": "gpt-4o-mini"
  }
  ```
  Response:
  ```json
  { "content": "assistant reply" }
  ```

## Concept Graph Routes

- `POST /sessions/{session_id}/concept-graph/build`
  ```json
  { "mode": "incremental" }
  ```
  Triggers concept extraction (incremental or full rebuild) and returns the graph snapshot.

- `GET /sessions/{session_id}/concept-graph`
  Returns the latest graph without rebuilding.

### Graph Structure Example

```json
{
  "concepts": [
    {
      "id": "feature-123",
      "label": "Telemetry pipeline",
      "type": "feature",
      "summary": "High-level outline of the telemetry topic",
      "first_seen_index": 0,
      "last_seen_index": 3
    }
  ],
  "edges": [
    {
      "id": "edge-789",
      "from_concept_id": "feature-123",
      "to_concept_id": "issue-222",
      "relation": "blocks",
      "introduced_index": 2
    }
  ],
  "meta": {
    "last_processed_index": 5,
    "graph_version": "1.0",
    "updated_ts": 1735930500.0
  }
}
```
