export function generateMcpKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function mcpServerUrl(mcpKey) {
  const base = import.meta.env.VITE_MCP_BASE_URL
  if (!base || !mcpKey) return null
  return `${base.replace(/\/$/, '')}/api/mcp/${mcpKey}`
}
