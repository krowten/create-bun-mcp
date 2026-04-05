import type { McpServer } from '@modelcontextprotocol/server'
import * as z from 'zod/v4'

export default function (server: McpServer) {
  server.registerTool(
    'ping',
    {
      title: 'Ping',
      description: 'Accepts a word and returns pong with it',
      inputSchema: z.object({
        word: z.string(),
      }),
    },
    async ({ word }) => {
      return {
        content: [
          {
            type: 'text',
            text: `pong ${word}`,
          },
        ],
      }
    },
  )
}
