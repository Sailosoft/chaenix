# AI Provider & Chat Configuration — Implementation Plan

## Goal

Add a multi-model selector to the admin chat, a Settings page for the global default model, and
image upload/paste/drag-drop that is actually forwarded to image-capable models as multimodal input
(blocked with a notice for text-only models).

## Decisions (resolved with user)

1. **Images are real multimodal input.** Image parts are preserved for image-capable models and
   stripped for text-only models. Server enforces this, client guards it.
2. **API key stays server-only.** `AI_API_KEY` / `DEEPINFRA_API_KEY` are never sent to the browser.
   Settings shows read-only provider status only (configured yes/no, masked key, base-URL host).
3. **Model selection is per-chat, persisted.** `ChatRecord.modelId` in Dexie, falling back to the
   Settings default. Reopening a chat restores its model.
4. **DeepInfra is a constant base URL.** Catalog models always use the DeepInfra v1 URL. Only
   **Native** uses `AI_BASE_URL` + `AI_MODEL`.
5. **Default model = `Flash Multi`** (`flash-multi`).

## Current-state facts (verified)

- `src/app/api/chat/route.ts:24-40` `toTextOnlyModelInput()` drops every non-text part and the route
  always uses `process.env.AI_MODEL` — images never reach the provider today.
- `src/app/admin/chat/chat-ui.tsx:540-609` `prepareSendMessagesRequest` rewrites every user message
  to a single text part (inlining text-file attachments from metadata), so it would also delete image
  file parts. Must be changed.
- `src/lib/chat-client-store.ts:26-38` Dexie schema v1; no `modelId`.
- `src/app/admin/admin-shell.tsx:14` hardcoded nav; no Settings entry.
- No `localStorage` usage anywhere in `src/`.
- SDK: `FileUIPart = { type: 'file'; mediaType; filename?; url }`, `url` may be a data URL
  (`node_modules/ai/dist/index.d.ts:1939`); `sendMessage` accepts `files?: FileList | FileUIPart[]`
  (`:5590`); `convertToModelMessages` turns file parts into provider image content (`:5646`).
- `.env:7-13` currently points at Ollama; a commented DeepInfra config (`api.deepinfra.com/v1/openai`)
  is present but not the validated catalog.

## Model catalog (from the request; IDS NEED VERIFICATION — see Risks)

Every catalog entry carries a `provider` label. All six DeepInfra models are hard-set to
`provider: "DeepInfra"`. **Native is the exception**: it is not DeepInfra and its `provider` is
resolved server-side from the `AI_BASE_URL` host (fallback `"Native"`).

| id | name | provider | cost | provider model | image | notes |
| --- | --- | --- | --- | --- | --- | --- |
| `native` | Native | `AI_BASE_URL` host (fallback `Native`) | fixed `mid` | `${AI_MODEL}` | env `AI_MODEL_IMAGE_SUPPORT` (default `true`) | uses `AI_BASE_URL`/`AI_API_KEY`; **not** DeepInfra |
| `flash` | Flash | `DeepInfra` | low | `deepseek-ai/DeepSeek-V4-Flash-0731` | no | text-only |
| `flash-multi` | Flash Multi | `DeepInfra` | low | `XiaomiMiMo/MiMo-V2.6-Flash` | yes | **default** |
| `flash-pro` | Flash Pro | `DeepInfra` | mid | `deepseek-ai/DeepSeek-V4.1-Flash` | yes | |
| `pro` | Pro | `DeepInfra` | mid | `zai-org/GLM-5.3` | yes | |
| `max` | Max | `DeepInfra` | high | `moonshotai/Kimi-K3` | yes | |
| `ultra` | Ultra | `DeepInfra` | high | `Qwen/Qwen3.8-2.4T-A95B` | yes | |

## Environment variables to add

- `DEEPINFRA_API_KEY` — DeepInfra key for catalog models (fallback: `AI_API_KEY`).
- `AI_MODEL_IMAGE_SUPPORT` — `true`/`false` for the Native entry (default `true`).
- The DeepInfra base URL is a **hard-coded constant** `https://api.deepinfra.com/v1/openai` in the
  catalog/provider module. There is no `DEEPINFRA_BASE_URL` env var.
- Existing `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` keep powering Native unchanged.
- Native's `cost` tier is a **hard-coded** `"mid"` (no env var).

Update the `ENV` YAML block in `README.md` to document these.

## Ordered tasks

1. **Catalog module (client-safe, no env, no secrets)** — new `src/lib/ai/catalog.ts`
   - Export `CostTier = 'low' | 'mid' | 'high'`, `ChatModel = { id; name; provider: string; cost:
     CostTier; imageSupport: boolean; providerModel: string }`, `NATIVE_MODEL_ID`, `DEFAULT_MODEL_ID =
     'flash-multi'`, the six static DeepInfra entries (each with `provider: "DeepInfra"`), plus
     `getModelById(id)` and `isModelId(id)`.
   - Export `DEEPINFRA_PROVIDER_NAME = "DeepInfra"` and the constant
     `DEEPINFRA_BASE_URL = "https://api.deepinfra.com/v1/openai"` so both are defined once.

2. **Server-only provider resolver** — new `src/lib/ai/provider.ts` with `import "server-only"`
   - `buildClientModelList()`: returns the static catalog (all `provider: "DeepInfra"`) **plus** the
     Native entry whose `providerModel` is the resolved `AI_MODEL` and `imageSupport` from
     `AI_MODEL_IMAGE_SUPPORT`; `cost` is fixed `"mid"`; `provider` derived from the `AI_BASE_URL` host
     (fallback `"Native"` — never `"DeepInfra"`). Returns no secrets.
   - `resolveModelSelection(modelId)`: returns `{ baseURL, apiKey, providerModel, provider }` — the
     constant `DEEPINFRA_BASE_URL` + `provider: "DeepInfra"` for catalog ids,
     `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` for `native`; `undefined` for unknown ids.
   - `getProviderStatus()`: `{ configured: boolean; maskedKey: string; baseUrlHost: string }` for the
     Settings page. Never returns the raw key.

3. **Client settings store** — new `src/lib/ai/settings.ts` (`"use client"` not required; guard
   `typeof window`)
   - `loadDefaultModelId()` / `saveDefaultModelId(id)` backed by `localStorage` key
     `chaenix.ai.settings` (`{ version: 1, defaultModelId }`). Validate on read against
     `isModelId`, fall back to `DEFAULT_MODEL_ID`.

4. **Per-chat model persistence** — edit `src/lib/chat-client-store.ts`
   - Add `modelId?: string` to `ChatRecord`; bump to `this.version(2)` (Dexie auto-migrates; no field
     transformation needed).
   - Add `setLocalChatModel(chatId, modelId)`.
   - Ensure `saveLocalChatSnapshot` preserves existing `modelId` (like it already preserves
     `titleIsCustom`).

5. **API route: model-aware + image-aware** — edit `src/app/api/chat/route.ts`
   - Read `model` from `ChatRequestBody`; resolve with `resolveModelSelection`. Unknown/missing →
     `400 { error: "Unknown model" }`.
   - Instantiate provider from the resolved `baseURL`/`apiKey`; call
     `provider.chat(resolvedProviderModel)`.
   - Replace `toTextOnlyModelInput` with a model-aware transform: keep `file` parts with
     `mediaType.startsWith("image/")` **only when** the selected catalog entry has
     `imageSupport === true`; always keep text parts. For text-only models, strip file parts (preserves
     today's behavior). Validate `mediaType` against an allowlist and drop anything unexpected.
   - Keep the `validateUIMessages` fallback and the `system-prompt` behavior unchanged.

6. **Chat page wiring** — edit `src/app/admin/chat/[id]/page.tsx`
   - Compute `models = buildClientModelList()` server-side; pass `models` into `ChatUi`. Read the
     selected chat's model from Dexie client-side (see task 7), so the server only supplies the
     catalog + default.

7. **Chat UI: selector, per-chat model, image input** — edit `src/app/admin/chat/chat-ui.tsx`
   - **Header selector**: dropdown listing `models` with name, `provider` label (`DeepInfra` for the
     catalog, the Native host label for Native), cost-tier badge, and image-support badge. On change:
     `setLocalChatModel(id, modelId)` + local state. Initialize state after mount:
     `getLocalChat(id)?.modelId ?? loadDefaultModelId()`. Render a neutral placeholder until mounted
     to avoid hydration mismatch.
   - **Send `model`**: add `model: modelId` to the `body` in `prepareSendMessagesRequest`.
   - **Preserve file parts**: in `prepareSendMessagesRequest`, keep `part.type === 'file'` parts; only
     rewrite text-attachment metadata (existing behavior) and leave image file parts intact.
   - **Inputs**: file picker (`handleFileSelect`), `onPaste` on the textarea, and drag-and-drop on the
     chat area. Accept `image/*` plus the existing text-file path.
   - **Guard**: when `!selectedModel.imageSupport` and an image is added by any input, reject it and
     show the notice: "Flash model does not support image input. Please switch to Flash Multi or
     another model." (use selected model's `name`). Text files remain allowed for text-only models.
   - **Validation**: allow `image/png|jpeg|webp|gif`; max **4 MB** per image and max **4** images per
     message (data URLs inflate payload; README notes ~4.5 MB body limits). Show inline errors.
   - **Send images**: build `FileUIPart[]` from the selected images (read as data URL) and pass as
     `files` to `sendMessage`, keeping `metadata.attachments` for text files. Clear on send.
   - **Render**: show image thumbnails for user messages' `file` parts (both composer preview and
     `MessageRow`).
   - Keep text-only stripping consistent with the server: if the model lacks support, never attach
     images client-side.

8. **Settings page** — new `src/app/admin/settings/page.tsx` (server component: auth-guard like the
   others, read provider status + `buildClientModelList`) and `settings-ui.tsx` (client)
   - Default-model dropdown persisted via `saveDefaultModelId`; each option shows its `provider` label.
   - Read-only provider panel: provider name(s), key configured yes/no, masked key, base-URL host
     (DeepInfra constant host + Native's `AI_BASE_URL` host). No editable key, no secret in props.
   - Optional: "last-used" info only; no other config surfaces in this iteration.

9. **Navigation** — edit `src/app/admin/admin-shell.tsx`
   - Add a `Settings` entry (`/admin/settings`, gear icon) to `adminNavItems`.

10. **Docs** — update the `ENV` section in `README.md` with the new variables.

## Key contracts to keep consistent

- A user message carries images as `parts: [{ type: "file", mediaType, url: <data URL> }]`; text-file
  attachments continue to travel as `metadata.attachments` and are inlined as text.
- Client and server must agree on image-capable models. Client uses `models[].imageSupport`; server
  re-checks `getModelById(model).imageSupport` (Native's value resolved server-side) before forwarding.
- Unknown model id → server `400`; client never sends one because the dropdown is the allowlist.
- Every catalog entry exposes a `provider` string. The six DeepInfra models are always `"DeepInfra"`;
  Native never reports `"DeepInfra"` and uses the `AI_BASE_URL` host label instead.

## Risks / mitigations

- **Model IDs are unverified.** `DeepSeek-V4-Flash-0731`, `MiMo-V2.6-Flash`, `GLM-5.3`, `Kimi-K3`,
  `Qwen3.8-2.4T-A95B` look like placeholder/future IDs and `.env` only references
  `deepseek-ai/DeepSeek-V4-Flash`. **Verify each against the live DeepInfra catalog before shipping**;
  a wrong id fails at request time. Keep all ids in `catalog.ts` so edits are one-line.
- **Payload size.** Base64 data URLs for images are large; without the 4 MB/4-image caps, large images
  risk body-limit rejections.
- **Hydration.** `localStorage`/Dexie reads are client-only; render a stable placeholder for the
  selector until mounted.
- **Native model capabilities are unknown.** If `AI_MODEL` points at a text-only model, set
  `AI_MODEL_IMAGE_SUPPORT=false` or the client will offer image input that the provider rejects.
- **History/regeneration.** Old chats have no `modelId` and fall back to the default; that is
  intended. Regenerating an old message uses the chat's current model.

## Validation

- `npm run lint` (eslint) and `npx tsc --noEmit` (no typecheck script exists) must pass.
- Manual: select a text-only model → paste/drop an image → notice shown, image not attached; select an
  image-capable model → image attaches, sends, and the model describes it.
- Manual: switch models in one chat, open another chat, reload → each chat keeps its model; a brand-new
  chat starts at the Settings default.
- Manual: Settings shows masked key + host and never exposes the raw key in the network response.
- Request-level: POST `/api/chat` with an unknown `model` → `400`; with an image part and a text-only
  model → image is stripped, text still streams.

## Out of scope

- Editable API keys, multiple named providers, and provider CRUD.
- Server-side persistence of settings (user chose localStorage/Dexie).
- Cost tracking/analytics per model (only the static `cost` tier badge is shown).
