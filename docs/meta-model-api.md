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

## Muse Spark 1.3 (reported)

- 1,048,576-token context.
- Function calling with `tools` and `tool_choice`.
- Structured outputs with a JSON schema in `response_format`.
- Reasoning effort is configurable (levels reported from "minimal" up to "xhigh"). Check the exact parameter name in the live docs (likely `reasoning_effort` on Chat Completions or `reasoning.effort` on Responses). Use the lowest level that keeps quality for intent extraction.
- Web search grounding is available, billed $2.50 per 1,000 searches. Check in the live docs how to enable it (built-in tool name and parameters) before coding `check_entry_requirements`.
- Audio input exists but is reported as not fully supported, quality may be degraded. Fallback only.

## Muse Voice Transcribe 1.0 (reported, confirm in live docs)

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

## Muse Image 1.0

- Text-to-image, image-to-image, reference-based. $0.01 per image. Check the live docs for the endpoint (`/v1/images/generations` or Responses) and output format (URL or base64).

## Limits

- Standard tier: 3,000 RPM and 4,000,000 TPM per team (reported).
- Spend alert at $120 on the account. The app has its own guardrail: above `SPEND_LIMIT_USD` the jury mode switches to replay only.
