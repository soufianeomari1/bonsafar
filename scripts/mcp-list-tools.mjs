// Lists the live tools of the Kiwi.com and trivago MCP servers and writes them
// to docs/mcp-tools.json. Usage: npm run mcp:tools
import { readFileSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
    }
  } catch {
    // No .env.local: rely on the shell environment.
  }
}

loadEnv(".env.local");

const servers = {
  kiwi: process.env.KIWI_MCP_URL,
  trivago: process.env.TRIVAGO_MCP_URL,
};

const out = { listed_at: new Date().toISOString(), servers: {} };

for (const [name, url] of Object.entries(servers)) {
  if (!url) throw new Error(`${name.toUpperCase()}_MCP_URL is not set`);
  const client = new Client({ name: "bonsafar", version: "0.1.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));
  const { tools } = await client.listTools();
  out.servers[name] = {
    url,
    server: client.getServerVersion() ?? null,
    tools,
  };
  console.log(`${name}: ${tools.map((tool) => tool.name).join(", ")}`);
  await client.close();
}

writeFileSync("docs/mcp-tools.json", `${JSON.stringify(out, null, 2)}\n`);
console.log("Wrote docs/mcp-tools.json");
