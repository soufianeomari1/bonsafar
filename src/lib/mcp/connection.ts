import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RunLog } from "@/lib/ai/events";

export type McpServer = "kiwi" | "trivago";

export class McpToolError extends Error {
  constructor(
    readonly tool: string,
    message: string,
  ) {
    super(message);
    this.name = "McpToolError";
  }
}

export type ToolResult = {
  structured: unknown;
  /** Text parts of the result, for tools without structuredContent. */
  text: string[];
};

type Connection = { client: Client; ready: Promise<void> };

/**
 * One MCP client per server and per server process: connected on first use
 * and reused by every run. A failed call drops the connection so the retry
 * starts from a fresh session.
 */
const connections = new Map<McpServer, Connection>();

function connect(server: McpServer, url: string): Connection {
  const existing = connections.get(server);
  if (existing) return existing;
  const client = new Client({ name: "bonsafar", version: "0.1.0" });
  const ready = client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const connection = { client, ready };
  connections.set(server, connection);
  ready.catch(() => connections.delete(server));
  return connection;
}

function drop(server: McpServer, connection: Connection) {
  if (connections.get(server) === connection) connections.delete(server);
  connection.client.close().catch(() => {});
}

function describe(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 200);
}

/**
 * Calls one MCP tool with a timeout and one retry, and logs a single event
 * (all attempts included). Data tools cost nothing: cost_usd stays 0.
 */
export async function callMcpTool({
  server,
  url,
  tool,
  args,
  log,
  step,
  timeoutMs = 20_000,
  retries = 1,
  summarize,
}: {
  server: McpServer;
  url: string;
  tool: string;
  args: Record<string, unknown>;
  log: RunLog;
  step: string;
  timeoutMs?: number;
  retries?: number;
  /** Short English note for the log, from the parsed result. */
  summarize?: (result: ToolResult) => string;
}): Promise<ToolResult> {
  const started = performance.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const connection = connect(server, url);
    try {
      await connection.ready;
      const raw = await connection.client.callTool({ name: tool, arguments: args }, undefined, {
        timeout: timeoutMs,
      });
      const content = Array.isArray(raw.content) ? raw.content : [];
      const text = content.flatMap((part) =>
        part && typeof part === "object" && part.type === "text" && typeof part.text === "string"
          ? [part.text]
          : [],
      );
      if (raw.isError) {
        throw new McpToolError(tool, text.join(" ").slice(0, 200) || "tool returned an error");
      }
      const result: ToolResult = { structured: raw.structuredContent ?? null, text };
      const summary = summarize?.(result);
      log.add({
        step,
        model: tool,
        latency_ms: Math.round(performance.now() - started),
        note: [summary, attempt > 0 ? "after 1 retry" : null].filter(Boolean).join(", ") || undefined,
      });
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof McpToolError) break;
      drop(server, connection);
    }
  }

  log.add({
    step,
    model: tool,
    latency_ms: Math.round(performance.now() - started),
    status: "error",
    note: describe(lastError),
  });
  throw lastError instanceof McpToolError ? lastError : new McpToolError(tool, describe(lastError));
}
