import type { McpServer } from '@modelcontextprotocol/server'

import commonTools from './common'

export default function (server: McpServer) {
  commonTools(server)
  // register your tools here
}
