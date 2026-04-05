import { serve } from 'bun'

import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server'
import type { McpServer } from '@modelcontextprotocol/server'

import { createServer } from './server'

const { PORT = '3000' } = process.env
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

const sessions = new Map<
  string,
  { transport: WebStandardStreamableHTTPServerTransport; server: McpServer; lastActivity: number }
>()

// Clean up idle sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
      void session.server.close()
      sessions.delete(id)
    }
  }
}, 60 * 1000)

serve({
  port: Number(PORT),
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname !== '/mcp') {
      return new Response('Not found', { status: 404 })
    }

    const sessionId = request.headers.get('mcp-session-id')

    if (request.method === 'GET' || request.method === 'DELETE') {
      if (!sessionId) {
        return new Response('Missing session ID', { status: 400 })
      }

      const session = sessions.get(sessionId)
      if (!session) {
        return new Response('Session not found', { status: 404 })
      }

      session.lastActivity = Date.now()
      const response = await session.transport.handleRequest(request)

      if (request.method === 'DELETE') {
        await session.server.close()
        sessions.delete(sessionId)
      }

      return response
    }

    if (request.method === 'POST') {
      if (sessionId) {
        const session = sessions.get(sessionId)
        if (!session) {
          return new Response('Session not found', { status: 404 })
        }

        session.lastActivity = Date.now()
        return session.transport.handleRequest(request)
      }

      const server = createServer()

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, { transport, server, lastActivity: Date.now() })
        },
        onsessionclosed: (closedSessionId) => {
          const session = sessions.get(closedSessionId)
          if (session) {
            void session.server.close()
            sessions.delete(closedSessionId)
          }
        },
      })

      await server.connect(transport)

      return transport.handleRequest(request)
    }

    return new Response('Method not allowed', { status: 405 })
  },
})
