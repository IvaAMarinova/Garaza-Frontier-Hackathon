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

- `POST /sessions/{session_id}/concept-graph/{concept_id}/expand`
  ```json
  {
    "expansion": "Call out the telemetry data flow and where React state lives",
    "weight": 0.8,
    "strength": 1.0,
    "auto_refine": true
  }
  ```
  Annotates a concept with a new expansion/weight, triggers the Goal Node refinement pass, and returns:
  ```json
  {
    "concept": { "...updated concept..." },
    "new_children": [
      {
        "id": "detail-state-model",
        "label": "State modeling constraints",
        "type": "concept",
        "summary": "Capture the telemetry state slices (selected metric, polling cadence, streaming buffer).",
        "first_seen_index": 3,
        "last_seen_index": 3,
        "weight": 0.31,
        "expansions": []
      }
    ],
    "new_edges": [
      {
        "id": "edge-detail",
        "from_concept_id": "feature-123",
        "to_concept_id": "detail-state-model",
        "relation": "refines",
        "introduced_index": 3
      }
    ]
  }
  ```
  When two or more expansions accumulate, decluttering is triggered automatically: the parent summary absorbs the existing expansions, and any truly new ideas are emitted via `new_children` + `new_edges`.

- `POST /sessions/{session_id}/concept-graph/{concept_id}/declutter`
  ```json
  {
    "force_children": false,
    "expansion_indices": [0, 2],
    "auto_refine": true
  }
  ```
  Explicitly runs the declutter pass (useful when you want to choose which expansions to promote). Returns the updated parent, any child concepts created, and the edges linking them:
  ```json
  {
    "parent": { "...concept after summarising the expansions..." },
    "children": [{ "...new child concept..." }],
    "edges": [{ "...refines edge..." }],
    "skipped_expansions": [5]
  }
  ```

### Graph Structure Example

```json
{
  "concepts": [
    {
      "id": "intent-SESSION",
      "label": "React telemetry dashboard intent",
      "type": "intent",
      "summary": "Central React intent: React telemetry dashboard intent",
      "first_seen_index": 0,
      "last_seen_index": 0,
      "weight": 1.0,
      "expansions": []
    },
    {
      "id": "feature-123",
      "label": "Telemetry pipeline",
      "type": "feature",
      "summary": "High-level outline of the telemetry topic",
      "first_seen_index": 0,
      "last_seen_index": 3,
      "weight": 0.62,
      "expansions": [
        "Focus on wiring props/state across settings form",
        "Highlight telemetry API choices as next deep-dive"
      ]
    }
  ],
  "edges": [
    {
      "id": "edge-intent",
      "from_concept_id": "intent-SESSION",
      "to_concept_id": "feature-123",
      "relation": "anchors",
      "introduced_index": 0
    },
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

## Goal Node Routes

- `POST /sessions/{session_id}/goal`
  ```json
  { "force": false }
  ```
  Creates the initial Depth-1 plan (or rebuilds when `force=true`).

- `GET /sessions/{session_id}/goal?create_if_missing=true`
  Fetches the current goal node (plan text + overlays + focus scores).

- `POST /sessions/{session_id}/goal/interactions`
  ```json
  {
    "events": [
      { "concept_id": "feature-123", "event": "expand", "strength": 1.0 }
    ],
    "auto_refine": true
  }
  ```
  Records focus signals for specific concepts and optionally triggers a selective refinement pass.

### Goal Node Response Sample

```json
{
  "id": "goal",
  "goal_statement": "Add telemetry pipeline drilldowns",
  "answer_markdown": "1. Sketch the React data flow at a high level...",
  "overlays": [
    {
      "id": "overlay-c1",
      "concept_id": "feature-123",
      "depth": 2,
      "content_markdown": "Revisit the settings form component...",
      "doc_links": ["https://react.dev/reference/react/Component"]
    }
  ],
  "focus": {
    "feature-123": {
      "interest_score": 0.8,
      "confusion_score": 0.3,
      "mastery_score": 0.1,
      "unknownness": 1.96
    }
  },
  "meta": {
    "global_answer_depth": 2,
    "last_updated_ts": 1735930500.0,
    "last_refined_concepts": ["feature-123"]
  }
}
```

### Expanding a Concept (Focus Workflow)

1. Fetch the concept graph to locate the concept ID you want to deepen:
   ```
   GET /v1/chat/sessions/{session_id}/concept-graph
   ```
2. Post a focus interaction to highlight that concept (use `event="expand"` or `event="revisit"`). This records interest, updates its weight, and can trigger an immediate refinement:
   ```json
   POST /v1/chat/sessions/{session_id}/goal/interactions
   {
     "events": [
       { "concept_id": "feature-123", "event": "expand", "strength": 1.0 }
     ],
     "auto_refine": true
   }
   ```
3. Re-fetch the goal node to see the updated plan/overlays, and re-fetch the concept graph to see the concept’s `expansions`/`weight` updated with the new detail.

4. Alternatively, call the dedicated expansion endpoint to both update the concept and trigger refinement in a single step:
   ```
   POST /v1/chat/sessions/{session_id}/concept-graph/{concept_id}/expand
   ```
   The response echoes the updated concept and includes any `new_children` + `new_edges` that were produced by the declutter pass.
