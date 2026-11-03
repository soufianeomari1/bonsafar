import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "openai/resources/chat/completions";
import { metaClient } from "./client";
import { tokenCostUsd } from "./pricing";
import type { RunEvent, RunLog } from "./events";

export type CallChatOptions = {
  log: RunLog;
  step: string;
  params: ChatCompletionCreateParamsNonStreaming;
  timeoutMs?: number;
  /** Extra attempts on network errors, timeouts, 429 and 5xx. */
  retries?: number;
  note?: string;
};

export type CallChatResult = {
  completion: ChatCompletion;
  content: string;
  event: RunEvent;
};

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIConnectionError) return true; // includes timeouts
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

/**
 * Every Chat Completions call goes through here: timeout, one retry, measured
 * latency (all attempts included), token count with reasoning billed as
 * output, cost from pricing.ts, and one event in the run log.
 */
export async function callChat({
  log,
  step,
  params,
  timeoutMs = 20_000,
  retries = 1,
  note,
}: CallChatOptions): Promise<CallChatResult> {
  const started = performance.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const completion = await metaClient().chat.completions.create(params, {
        timeout: timeoutMs,
        maxRetries: 0,
      });
      const usage = completion.usage;
      const tokensIn = usage?.prompt_tokens ?? 0;
      const cachedIn = usage?.prompt_tokens_details?.cached_tokens ?? 0;
      const tokensOut = usage?.completion_tokens ?? 0;
      const reasoning = usage?.completion_tokens_details?.reasoning_tokens ?? 0;

      const event = log.add({
        step,
        model: params.model,
        latency_ms: Math.round(performance.now() - started),
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        tokens_reasoning: reasoning,
        cost_usd: tokenCostUsd(params.model, { tokensIn, cachedIn, tokensOut }),
        note: attempt > 0 ? [note, "after 1 retry"].filter(Boolean).join(", ") : note,
      });

      return {
        completion,
        content: completion.choices[0]?.message?.content ?? "",
        event,
      };
    } catch (error) {
      lastError = error;
      if (attempt < retries && isRetryable(error)) continue;
      break;
    }
  }

  log.add({
    step,
    model: params.model,
    latency_ms: Math.round(performance.now() - started),
    status: "error",
    note: describeError(lastError),
  });
  throw lastError;
}
