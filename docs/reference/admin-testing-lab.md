# Admin Testing Lab

The **Sophia Testing Lab** provides admins with an authenticated sandbox for live prompts against Sophia using Google’s Gemini API. This document captures the moving pieces so future changes remain consistent.

## Feature Overview
- **UI Route:** `apps/web/src/app/admin/testing/page.tsx`
- **API Endpoint:** `POST /api/admin/testing` (`apps/web/src/app/api/admin/testing/route.ts`)
- **Service Layer:** `GoogleAIService` (`packages/services/src/google-ai.service.ts`)
- **Navigation Entry:** `Testing Lab` item in `AdminSidebar` (`apps/web/src/components/admin/AdminSidebar.tsx`)

The UI keeps a local chat transcript, exposes token counts and Google safety ratings, and resets the session client-side. Error details are surfaced, including quota or auth failures, to help operators debug without digging into logs.

## Environment Variables
Configure these in local `.env` files and all Vercel environments:

| Variable | Description | Default |
| --- | --- | --- |
| `GOOGLE_AI_API_KEY` | Required Gemini API key for generating responses | — |
| `GOOGLE_AI_MODEL` | Optional override for the model name | `gemini-2.0-flash` |
| `GOOGLE_AI_API_BASE_URL` | Optional override for the REST base URL | `https://generativelanguage.googleapis.com/v1beta` |

Quota or billing issues from Google return HTTP 429/4xx. The API handler translates those into explicit error messages so admins know when the key is exhausted or misconfigured.

## Deployment Notes
1. Update `.env.example` when env keys change so new engineers can bootstrap correctly.
2. Sync Vercel environment variables via `vercel env add` before triggering a production deploy.
3. Run `npm run build` and `npm run test` locally; the services package includes `google-ai.service.test.ts` to cover fetch wiring and error handling.

When rotating keys, remember to redeploy the dashboard—the admin route executes server-side and needs the refreshed environment at build/runtime.
