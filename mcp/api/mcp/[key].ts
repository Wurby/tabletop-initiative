import type { IncomingMessage, ServerResponse } from 'node:http';
import { TOOLS, callTool } from '../../lib/tools/index.js';

// ── MCP Protocol constants ────────────────────────────────────────────────────

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'tabletop-initiative', version: '1.0.0' };

// ── JSON-RPC types ────────────────────────────────────────────────────────────

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ── Vercel handler ────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> },
  res: ServerResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawKey = req.query?.key;
  const mcpKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  if (!mcpKey) {
    json(res, 400, { error: 'Missing MCP key in URL.' });
    return;
  }

  if (req.method === 'GET') {
    json(res, 200, { ...SERVER_INFO, protocol: PROTOCOL_VERSION });
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readBody(req);
    const result = await dispatch(mcpKey, body);

    if (result === null) {
      res.writeHead(204);
      res.end();
    } else {
      json(res, 200, result);
    }
  } catch (err) {
    json(res, 500, jsonRpcError(null, -32603, `Internal error: ${String(err)}`));
  }
}

// ── JSON-RPC dispatcher ───────────────────────────────────────────────────────

async function dispatch(mcpKey: string, body: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map((r) => dispatchOne(mcpKey, r)))).filter(
      (r): r is JsonRpcResponse => r !== null,
    );
    return responses.length > 0 ? responses : null;
  }
  return dispatchOne(mcpKey, body);
}

async function dispatchOne(mcpKey: string, raw: unknown): Promise<JsonRpcResponse | null> {
  if (!isRequest(raw)) {
    return jsonRpcError(null, -32600, 'Invalid Request');
  }

  const { id, method, params } = raw;
  const isNotification = id === undefined;

  try {
    switch (method) {
      case 'initialize':
        return reply(id ?? null, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });

      case 'notifications/initialized':
        return null;

      case 'ping':
        return reply(id ?? null, {});

      case 'tools/list':
        return reply(id ?? null, { tools: TOOLS });

      case 'tools/call': {
        const result = await callTool(mcpKey, params);
        return reply(id ?? null, result);
      }

      default:
        if (isNotification) return null;
        return jsonRpcError(id ?? null, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    if (isNotification) return null;
    return jsonRpcError(id ?? null, -32603, String(err));
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRequest(v: unknown): v is JsonRpcRequest {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as JsonRpcRequest).jsonrpc === '2.0' &&
    typeof (v as JsonRpcRequest).method === 'string'
  );
}

function reply(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    req.on('end', () => {
      try { resolve(raw.length ? JSON.parse(raw) : undefined); }
      catch { resolve(undefined); }
    });
    req.on('error', reject);
  });
}
