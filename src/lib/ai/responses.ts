import OpenAI from "openai";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
} from "openai/resources/responses/responses";
import { metaClient } from "./client";
import { tokenCostUsd, WEB_SEARCH_USD_PER_QUERY } from "./pricing";
import type { RunEvent, RunLog } from "./events";

/**
 * Responses API twin of callChat, for what Chat Completions cannot do (the
 * web_search tool). Same contract: timeout, one retry, one measured event.
 * Web searches are billed per query on top of tokens; opened pages are
 * counted in the note only.
 */

export type CallResponsesResult = {
  response: Response;
  /** Text of the last assistant message (earlier ones are progress notes). */
  finalText: string;
  searches: number;
  event: RunEvent;
};

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIConnectionError) return true;
  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 0;
    return status === 429 || status >= 500;
  }
  return false;
}

function describeError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    return `${error.status ?? "network"} ${error.message}`.slice(0, 200);
  }
  return error instanceof Error ? error.message.slice(0, 200) : "unknown error";
}

function lastMessageText(response: Response): string {
  for (let i = response.output.length - 1; i >= 0; i -= 1) {
    const item = response.output[i];
    if (item.type !== "message") continue;
    return item.content
      .map((part) => (part.type === "output_text" ? part.text : ""))
      .join("");
  }
  return "";
}

function countWebActions(response: Response): { searches: number; pages: number } {
  let searches = 0;
  let pages = 0;
  for (const item of response.output) {
    if (item.type !== "web_search_call") continue;
    const action = (item as { action?: { type?: string } }).action;
    if (action?.type === "open_page" || action?.type === "find_in_page") pages += 1;
    else searches += 1;
  }
  return { searches, pages };
}

export async function callResponses({
  log,
  step,
  params,
  timeoutMs = 30_000,
  retries = 1,
  note,
}: {
  log: RunLog;
  step: string;
  params: ResponseCreateParamsNonStreaming;
  timeoutMs?: number;
  retries?: number;
  note?: string;
}): Promise<CallResponsesResult> {
  const started = performance.now();
  let lastError: unknown;
  const model = String(params.model);

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await metaClient().responses.create(params, {
        timeout: timeoutMs,
        maxRetries: 0,
      });
      const usage = response.usage;
      const tokensIn = usage?.input_tokens ?? 0;
      const cachedIn = usage?.input_tokens_details?.cached_tokens ?? 0;
      const tokensOut = usage?.output_tokens ?? 0;
      const reasoning = usage?.output_tokens_details?.reasoning_tokens ?? 0;
      const { searches, pages } = countWebActions(response);

      const event = log.add({
        step,
        model,
        latency_ms: Math.round(performance.now() - started),
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        tokens_reasoning: reasoning,
        cost_usd:
          tokenCostUsd(model, { tokensIn, cachedIn, tokensOut }) +
          searches * WEB_SEARCH_USD_PER_QUERY,
        note: [
          note,
          `${searches} web searches, ${pages} pages opened`,
          attempt > 0 ? "after 1 retry" : null,
        ]
          .filter(Boolean)
          .join(", "),
      });

      return { response, finalText: lastMessageText(response), searches, event };
    } catch (error) {
      lastError = error;
      if (attempt < retries && isRetryable(error)) continue;
      break;
    }
  }

  log.add({
    step,
    model,
    latency_ms: Math.round(performance.now() - started),
    status: "error",
    note: describeError(lastError),
  });
  throw lastError;
}
