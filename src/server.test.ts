import type { Transport } from '@modelcontextprotocol/client'

import { serve } from 'bun'
import { afterAll, describe, expect, test } from 'bun:test'
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

import app from './http'

const http = serve({ port: 0, fetch: app.fetch })
afterAll(() => http.stop(true))

const transports: Record<string, () => Transport> = {
  stdio: () => new StdioClientTransport({ command: 'bun', args: ['src/index.ts'], cwd: `${import.meta.dir}/..` }),
  http: () => new StreamableHTTPClientTransport(new URL('/mcp', http.url)),
}

const eras = { modern: { pin: '2026-07-28' }, legacy: 'legacy' } as const

describe.each(Object.keys(transports))('%s', (transport) => {
  test.each(Object.keys(eras) as (keyof typeof eras)[])('%s client lists and calls tools', async (era) => {
    const client = new Client({ name: 'test', version: '1.0.0' }, { versionNegotiation: { mode: eras[era] } })
    await client.connect(transports[transport]!())

    try {
      expect(client.getProtocolEra()).toBe(era)

      const { tools } = await client.listTools()
      expect(tools.map((tool) => tool.name)).toContain('ping')

      const result = await client.callTool({ name: 'ping', arguments: { word: 'hello' } })
      expect(result.content).toEqual([{ type: 'text', text: 'pong hello' }])
    } finally {
      await client.close()
    }
  })
})

describe('http endpoint', () => {
  test('answers 404 outside /mcp', async () => {
    const response = await fetch(new URL('/other', http.url))
    expect(response.status).toBe(404)
  })

  test('rejects a foreign Origin', async () => {
    const response = await fetch(new URL('/mcp', http.url), {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
      body: '{}',
    })
    expect(response.status).toBe(403)
  })
})
