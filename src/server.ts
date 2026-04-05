import { McpServer } from '@modelcontextprotocol/server'
import tools from './tools'

export function createServer() {
  const server = new McpServer({
    name: 'bun-mcp-starter',
    version: '1.0.0',
  })

  tools(server)

  return server
}
