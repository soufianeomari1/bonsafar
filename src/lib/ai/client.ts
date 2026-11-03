import OpenAI from "openai";
import { serverEnv } from "@/lib/env";

let client: OpenAI | null = null;

/**
 * The one OpenAI SDK client, pointed at the Meta Model API. Server only:
 * serverEnv() throws in the browser. The SDK does not read META_API_KEY on
 * its own, so the key is passed explicitly. Retries are handled by call.ts.
 */
export function metaClient(): OpenAI {
  if (client) return client;
  const env = serverEnv();
  client = new OpenAI({
    baseURL: env.META_API_BASE_URL,
    apiKey: env.META_API_KEY,
    maxRetries: 0,
  });
  return client;
}
