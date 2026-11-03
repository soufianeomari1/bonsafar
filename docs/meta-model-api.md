# Meta Model API: verified facts for BonSafar

Last checked: 2026-11-03, 16:30 Paris time. "Verified" means tested with our own key or read in the Meta dashboard. "Reported" means read in third-party docs (LiteLLM, OpenRouter, Pipecat): confirm against the live Meta docs before relying on it.

Live docs (add them in Cursor: Settings > Indexing & Docs):
- https://dev.meta.ai/docs
- https://dev.meta.ai/docs/models
- https://dev.meta.ai/docs/speech-to-text
- https://dev.meta.ai/docs/api-reference/voice/realtime
- https://dev.meta.ai/docs/image-generation

## Access (verified)

- Base URL: `https://api.meta.ai/v1`, auth `Authorization: Bearer <key>`.
- OpenAI-compatible: Chat Completions (`/v1/chat/completions`) and Responses (`/v1/responses`). Also an Anthropic-style Messages endpoint.
- The OpenAI SDK does not read our key automatically: always pass `apiKey: process.env.META_API_KEY`.
- `GET /v1/models` works with our key. Models available to our team on 2026-11-03:
  `muse-wonder-1.0`, `muse-spark-1.3`, `muse-spark-1.3-contributor`, `muse-spark-1.2`, `muse-spark-1.2-contributor`, `muse-spark-1.1`, `muse-voice-transcribe-1.0`, `muse-image-1.0`, `sam-3.1`.
- A chat completion on `muse-spark-1.3` worked: a one-line darija sentence was translated correctly. It used 745 reasoning tokens out of 764 output tokens: reasoning is on by default and costs time and money.

## Models we use

| Env var | Model ID | Price (Meta dashboard) | Role |
|---|---|---|---|
| `MODEL_TRANSCRIBE` | `muse-voice-transcribe-1.0` | $0.18 per hour of audio | Voice note to text |
| `MODEL_SPARK` | `muse-spark-1.3` | $1.25 in / $0.15 cached / $4.25 out per 1M tokens | Intent JSON, bilingual messages, entry requirements, good to know |
| `MODEL_WONDER` | `muse-wonder-1.0` | $4.00 in / $0.20 cached / $20.00 out per 1M tokens | Agent planner with tools |
| `MODEL_IMAGE` | `muse-image-1.0` | $0.01 per image | Text-free illustrations and poster |
| `MODEL_SPARK_AUDIO` | `muse-spark-1.3` | same as Spark | Fallback transcription only |

Never use `-contributor` models (inputs used for training, 100 RPM limit). "Muse Wonder Full" needs a Muse Code subscription: not available to us.

Reasoning tokens are billed as output tokens. Count them in cost.

## Muse Spark 1.3

Verified on 2026-11-03 (block 2, `src/app/api/intent`):
- `reasoning_effort: "minimal"` on Chat Completions works and cuts reasoning tokens (189 reasoning tokens out of 445 output tokens for the Istanbul intent).
- `completion_tokens` already includes the reasoning tokens (`completion_tokens_details.reasoning_tokens`): do not add them twice in cost.
- `response_format: { type: "json_schema", ... }` is honoured; we still validate with zod.
- Measured intent extraction (darija Istanbul sentence, 1,361 tokens in): 5.3 s, $0.0022. Typical range 5 to 10 s, above the 5 s target.
- Audio input works through `{ type: "input_audio", input_audio: { data: <base64>, format: "wav" } }`. With `"minimal"` it repeated phrases in our tests, so the fallback transcription uses `"low"`.

Reported:

- 1,048,576-token context.
- Function calling with `tools` and `tool_choice`.
- Structured outputs with a JSON schema in `response_format`.
- Reasoning effort is configurable (levels reported from "minimal" up to "xhigh"). Check the exact parameter name in the live docs (likely `reasoning_effort` on Chat Completions or `reasoning.effort` on Responses). Use the lowest level that keeps quality for intent extraction.
- Web search grounding is available, billed $2.50 per 1,000 searches. Check in the live docs how to enable it (built-in tool name and parameters) before coding `check_entry_requirements`.

Verified on 2026-11-03 (block 3, `src/lib/agent/entry.ts`, `src/lib/ai/responses.ts`):
- Web search works only on the Responses API (`/v1/responses`), not on Chat Completions: `tools: [{ type: "web_search", search_context_size: "low" }]`. Price confirmed on dev.meta.ai/docs/pricing-rate-limits: $2.50 per 1,000 search queries on top of tokens.
- It combines with structured output: `text: { format: { type: "json_schema", name, schema } }`. The output holds several `message` items (progress notes, then the JSON): parse the last one only.
- Each search or opened page is a `web_search_call` item (`action.type` = `search` or `open_page`). We bill `search` items only and count opened pages in the log note.
- With a JSON output, `url_citation` annotations are usually missing. `include: ["web_search_call.results"]` returns the raw hits (title, url): sources are taken from there, official government domains first.
- `reasoning: { effort: "minimal" }` plus "at most two searches" in the prompt: 8 to 14 s, $0.012 to $0.038 per check (a page open can push input to 37k tokens).
- Usage fields on Responses: `input_tokens`, `input_tokens_details.cached_tokens`, `output_tokens`, `output_tokens_details.reasoning_tokens`.
- Audio input exists but is reported as not fully supported, quality may be degraded. Fallback only.

## Muse Voice Transcribe 1.0: verified on 2026-11-03 (block 2)

Implementation: `src/lib/ai/transcribe.ts`.

- URL: `wss://api.meta.ai/v1/asr/realtime?sessionId=<id>`. The `Authorization` header on the HTTP upgrade is not enough: auth goes in the first JSON message after `open`.
- First message: `{ authorization: { accessToken: "Bearer <key>" }, audioEncoding: "PCM_24KHZ" | "PCM_16KHZ", model, mode: "PUSH_TO_TALK", partialMode: "CUMULATIVE", emitAudioProgress: true, keywords: [...], languageBias: ["Arabic", "French"] }`.
- The server acknowledges with a JSON object that has `sessionId` and no `type`. Only then send audio: raw PCM16 binary frames (we send 80 ms frames).
- Pacing: audio more than about 5 s ahead of `audioProcessedMs` is rejected, and so is audio sent slower than real time. We keep a 4 s lead.
- End of audio: send `{ "type": "endStream" }`. Events have `type: "transcript"` with `final: false` (cumulative partials, each replaces the previous one) then `final: true`. The server closes with 1000 after the final transcript; we close ourselves after 1.5 s otherwise.
- A batch endpoint `/v1/asr/transcribe` also exists (not used: the realtime path gives live partial words).
- Measured: 9.0 s of clean French speech gave a near-perfect transcript in 3.7 s server-side, $0.00045 ($0.18 per hour). Silence returns an empty final transcript, which the app shows as "nothing heard".
- Darija is not one of the supported languages: the Arabic and French bias works, but noisy starts can come out as Arabic-script words.

Earlier notes from third-party docs, kept for reference:
- Served on Meta Model API as realtime only: `wss://api.meta.ai/v1/asr/realtime`. No `/v1/audio/transcriptions` batch endpoint.
- Audio: PCM 16-bit, mono, 16 kHz or 24 kHz, sent as binary frames.
- Emits speech start, partial transcript deltas, speech stop and completed transcript events. Trailing audio after the last completed event is billed when the session closes.
- Supports a language setting and a multilingual mode (`language_bias`) for speech that mixes languages. Darija is not an official language: bias toward Arabic and French.
- Keyword hints are supported (useful for city names: Istanbul, Paris, Marrakech).
- Reference client implementations: Pipecat `MetaSTTService` and the LiteLLM Meta provider.

### How BonSafar uses it
1. The browser records the voice note and sends it to `POST /api/transcribe` (WAV PCM16 mono 24 kHz; convert in the browser with `AudioContext` if MediaRecorder gives webm or mp4).
2. The route opens the WebSocket server-side with our key (`ws` package), streams the PCM frames, collects the final transcript, and streams partial deltas back to the browser (SSE) so words appear live.
3. The key never reaches the browser. The audio is never stored.

## Muse Wonder 1.0

- Agent model built for long tasks, tool use and error recovery (Meta dashboard).
- We use Chat Completions with `tools` (function calling). Check the live docs for parallel tool calls and streaming with tools.

Verified on 2026-11-03 (block 3, `src/lib/agent/run.ts`):
- Parallel tool calls come by default: the first turn returns all 4 tool calls at once.
- `tools` and `response_format: { type: "json_schema" }` work in the same request: the model calls tools, then answers with schema-valid JSON once it has the data. `tool_choice: "none"` forces the answer.
- `reasoning_effort: "minimal"` works. On the final package turn (about 4k tokens in, 1k out) it took 10 to 14 s, against 11 to 20 s with `"low"`, with the same choices on our two scenarios.
- Measured full runs (Kiwi.com + trivago + Spark web search + Wonder): Istanbul 25.7 s, $0.068; Paris with the visa-free switch to Istanbul 32.6 s, $0.075.

## Muse Image 1.0

- Text-to-image, image-to-image, reference-based. $0.01 per image. Check the live docs for the endpoint (`/v1/images/generations` or Responses) and output format (URL or base64).

## Limits

- Standard tier: 3,000 RPM and 4,000,000 TPM per team (reported).
- Spend alert at $120 on the account. The app has its own guardrail: above `SPEND_LIMIT_USD` the jury mode switches to replay only.
