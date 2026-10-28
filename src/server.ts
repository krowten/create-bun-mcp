import { McpServer } from '@modelcontextprotocol/server'

import registerTools from './tools'

export function createServer() {
  const server = new McpServer({
    name: 'bun-mcp-starter',
    version: '1.0.0',
  })

  registerTools(server)

  return server
}
