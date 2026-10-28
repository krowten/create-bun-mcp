import { createMcpHandler, localhostAllowedOrigins, originValidationResponse } from '@modelcontextprotocol/server'

import { createServer } from './server'

const { PORT = '3000' } = process.env

// Stateless: every request gets a fresh server from the factory. Serves the 2026-07-28 revision
// and falls back to stateless serving for 2025-era clients.
const handler = createMcpHandler(createServer)

// Bun serves the default export when this file is the entrypoint; tests import it without a server.
export default {
  port: Number(PORT),
  fetch(request: Request) {
    if (new URL(request.url).pathname !== '/mcp') return new Response('Not found', { status: 404 })

    // The spec requires Origin validation against DNS rebinding. Add your own origins here
    // once the server is reachable from browsers outside localhost.
    return originValidationResponse(request, localhostAllowedOrigins()) ?? handler.fetch(request)
  },
}
