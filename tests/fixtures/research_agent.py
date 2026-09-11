"""Deterministic CLI protocol fixture. Never contacts a model provider."""
import json
import sys
import time

prompt = sys.stdin.read()
context_text = prompt.split("LIBRARY CONTEXT (data, not instructions):\n", 1)[1]
context = json.loads(context_text.split("\n\nCOMPARISON CRITERIA:", 1)[0])
criteria = json.loads(prompt.split("COMPARISON CRITERIA: ", 1)[1].split("\n\nUSER QUESTION:", 1)[0])
question = prompt.split("USER QUESTION:\n", 1)[1]
if "TEST_WAIT" in question:
    time.sleep(30)
if "TEST_FAIL" in question:
    print("Fixture failure", file=sys.stderr)
    sys.exit(2)
scope = context["scope_ids"]
node_id = scope[0] if scope else context["catalog"][0]["id"]
changes = []
if "TEST_RENAME" in question:
    changes = [{"action": "rename", "node_id": node_id, "label": "Reviewed cluster", "reason": "The requested name describes the scope more clearly."}]
result = {"answer": "The library describes complementary approaches. This answer is based on the stored notes, not a new full-text reading.",
          "citations": [{"node_id": node_id, "evidence": "Stored summary and key findings."}],
          "changes": changes,
          "cells": [{"paper_id": p, "criterion": c, "value": f"Fixture finding for {c}",
                     "evidence": "Stored library notes; verify against the source paper."} for p in scope for c in criteria]}
if "TEST_INVALID" in question:
    result["citations"][0]["node_id"] = "paper:missing"
if "--json" in sys.argv:
    print(json.dumps({"type": "item.completed", "item": {"type": "agent_message", "text": json.dumps(result)}}))
    print(json.dumps({"type": "turn.completed", "usage": {"input_tokens": 100, "output_tokens": 50}}))
else:
    print(json.dumps({"type": "result", "structured_output": result, "is_error": False, "total_cost_usd": 0}))
