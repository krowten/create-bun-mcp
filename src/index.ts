import { StdioServerTransport } from '@modelcontextprotocol/server'

import { createServer } from './server'

const server = createServer()

const transport = new StdioServerTransport()

await server.connect(transport)
