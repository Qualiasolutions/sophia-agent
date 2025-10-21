# Service Consolidation Baseline (Phase 1)

Last updated: 2025-10-20  
Owner: Codex refactor pass

## Goals
- Identify service modules that remain in active use versus candidates for archival.
- Provide a single reference before the Phase 2 backend alignment work begins.

## Inventory Snapshot
| Namespace | Status | Notes / Call-to-Action |
|-----------|--------|------------------------|
| `openai.service.ts` | ✅ Active | Primary conversational agent orchestration. |
| `deepseek.service.ts` | ✅ Active | Telegram fallback; export gap noted in roadmap (Phase 2). |
| `assistant.service.ts` | ⚠️ Legacy | Only referenced in historical tests; schedule for consolidation with EnhancedDocument pipeline. |
| `document.service.ts` | ⚠️ Legacy | Depends on missing `knowledge-base.service`; mark for removal once enhanced pipeline replaces it. |
| `document-enhanced.service.ts` & `enhanced-document.service.ts` | ⚠️ Duplicate | Maintain `enhanced-document.service.ts` as source of truth; evaluate API parity before deletion. |
| `openai-enhanced.service.ts`, `template-*` optimizers | ⚠️ Needs review | Verify runtime usage from `/api/document-sessions/*`; confirm before pruning. |
| `whatsapp.service.ts` | ⚠️ Legacy (Twilio) | Replace with Meta service in production flows; archive under `legacy/` in Phase 2. |
| `whatsapp-meta.service.ts` | ✅ Active | Current webhook uses Meta client. |
| `google-ai.service.ts`, `chatbase.service.ts` | ✅ Active | Covered by recent Vitest suites; keep. |
| `message-forward.service.ts` | ⚠️ Mixed | Instantiates Twilio transport; rework to consume Meta client during Phase 2. |

## Next Actions
1. Create `packages/services/legacy/` folder during Phase 2 and relocate the marked legacy modules after verifying no production imports.
2. Update `packages/services/src/index.ts` to expose only supported services once the relocation is complete.
3. Delete redundant document-generation modules after adding regression tests for `/api/document-sessions`.
4. Re-run lint/tests to ensure no orphaned imports remain post clean-up.
