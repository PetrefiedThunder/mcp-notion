#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://api.notion.com/v1";
const RATE_LIMIT_MS = 350; // Notion: 3 req/sec
let last = 0;

function getKey(): string {
  const k = process.env.NOTION_API_KEY;
  if (!k) throw new Error("NOTION_API_KEY required (internal integration token)");
  return k;
}

async function notionFetch(path: string, method = "GET", body?: any): Promise<any> {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
  const opts: RequestInit = {
    method, headers: { Authorization: `Bearer ${getKey()}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) throw new Error(`Notion ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return res.json();
}

const server = new McpServer({ name: "mcp-notion", version: "1.0.0" });

server.tool("search", "Search pages and databases in Notion.", {
  query: z.string().optional(), filter: z.enum(["page", "database"]).optional(),
  pageSize: z.number().min(1).max(100).default(10),
}, async ({ query, filter, pageSize }) => {
  const body: any = { page_size: pageSize };
  if (query) body.query = query;
  if (filter) body.filter = { value: filter, property: "object" };
  const d = await notionFetch("/search", "POST", body);
  const results = d.results?.map((r: any) => ({
    id: r.id, object: r.object, url: r.url,
    title: r.properties?.title?.title?.[0]?.plain_text || r.properties?.Name?.title?.[0]?.plain_text || r.title?.[0]?.plain_text || "(untitled)",
    lastEdited: r.last_edited_time,
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.results?.length, results }, null, 2) }] };
});

server.tool("get_page", "Get a Notion page and its properties.", {
  pageId: z.string(),
}, async ({ pageId }) => {
  const d = await notionFetch(`/pages/${pageId}`);
  return { content: [{ type: "text" as const, text: JSON.stringify(d, null, 2) }] };
});

server.tool("get_page_content", "Get the block content of a page.", {
  pageId: z.string(), pageSize: z.number().min(1).max(100).default(50),
}, async ({ pageId, pageSize }) => {
  const d = await notionFetch(`/blocks/${pageId}/children?page_size=${pageSize}`);
  const blocks = d.results?.map((b: any) => {
    const type = b.type;
    const content = b[type];
    let text = "";
    if (content?.rich_text) text = content.rich_text.map((t: any) => t.plain_text).join("");
    else if (content?.text) text = content.text.map((t: any) => t.plain_text).join("");
    return { type, text: text || undefined, hasChildren: b.has_children };
  });
  return { content: [{ type: "text" as const, text: JSON.stringify(blocks, null, 2) }] };
});

server.tool("query_database", "Query a Notion database.", {
  databaseId: z.string(), filter: z.string().optional().describe("JSON filter object"),
  pageSize: z.number().min(1).max(100).default(20),
}, async ({ databaseId, filter, pageSize }) => {
  const body: any = { page_size: pageSize };
  if (filter) body.filter = JSON.parse(filter);
  const d = await notionFetch(`/databases/${databaseId}/query`, "POST", body);
  return { content: [{ type: "text" as const, text: JSON.stringify({ total: d.results?.length, results: d.results }, null, 2) }] };
});

server.tool("create_page", "Create a new page in a database or as child of a page.", {
  parentId: z.string().describe("Database ID or page ID"),
  parentType: z.enum(["database_id", "page_id"]).default("database_id"),
  title: z.string(), content: z.string().optional().describe("Plain text content for the page body"),
}, async ({ parentId, parentType, title, content }) => {
  const body: any = {
    parent: { [parentType]: parentId },
    properties: { title: { title: [{ text: { content: title } }] } },
  };
  if (content) {
    body.children = [{ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content } }] } }];
  }
  const d = await notionFetch("/pages", "POST", body);
  return { content: [{ type: "text" as const, text: JSON.stringify({ id: d.id, url: d.url }, null, 2) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
