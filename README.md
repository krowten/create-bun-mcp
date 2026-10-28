# Bun MCP Starter

A modern, fast [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server built with [Bun](https://bun.sh/). This project is a clean starter for building your own MCP servers with TypeScript and Bun.

## Features

- **Built with Bun**: High performance, fast startup, and native TypeScript support
- **Official MCP SDK**: Uses `@modelcontextprotocol/server`
- **Latest protocol**: Speaks MCP revision `2026-07-28` and still serves 2025-era clients
- **TypeScript First**: Simple setup for modern Bun development
- **Code Quality**: Pre-configured with ESLint and Prettier
- **Transport Support**: Supports both **stdio** and stateless **Streamable HTTP** transports
- **Tested**: Ships with `bun test` tests that drive the server through a real MCP client
- **Clean Structure**: Separation between server logic, tools, and transport entry points

## Why Bun?

Bun provides native high-performance APIs that make MCP servers simpler and faster:

- **Native SQLite**
- **Native S3**
- **Native Redis**
- **Fast startup and execution**
- **Direct TypeScript execution**

## Structure

```
src/
  index.ts       # stdio transport entrypoint
  http.ts        # HTTP transport entrypoint
  server.ts      # core server logic
  server.test.ts # tests over stdio and HTTP
  tools/
    index.ts     # registers all tools
    common.ts    # sample tool
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed

### Usage (Quick Start)

You can create a new MCP server project instantly using `bunx`:

```bash
bunx create-bun-mcp my-mcp
```

This will create a new directory, copy the boilerplate, and install all dependencies automatically. Pass `--no-install` to skip the install step.

### Integration with Claude CLI (Claude Code)

To use your new server with [Claude CLI](https://github.com/anthropics/claude-code), add it to your `.mcp.json` or `.claude/settings.json` file in your project root.

**Pro-tip:** For stable relative path resolution in Claude Code, always use `bun run` and start your path with `./`.

```json
{
  "mcpServers": {
    "my-mcp": {
      "command": "bun",
      "args": ["run", "./my-mcp/src/index.ts"]
    }
  }
}
```

### Manual Installation (For Development)

If you want to modify this boilerplate itself:

1. Clone or download this repository
2. Install dependencies:

```bash
bun install
```

## Development

### Stdio mode

```bash
bun run dev
```

### HTTP mode

```bash
bun run dev:http
```

Default HTTP endpoint:

```
http://localhost:3000/mcp
```

The HTTP server is stateless: every request is served by a fresh server instance, as the `2026-07-28` revision expects. Requests with a browser `Origin` other than localhost are rejected to prevent DNS rebinding; add your origins in `src/http.ts` before exposing the server to browsers.

### Tests and type checking

```bash
bun test
bun run check
```

## MCP Inspector

### Inspect stdio

```bash
bun run inspect
```

### Inspect HTTP

1. Start server:

```bash
bun run dev:http
```

2. Start inspector:

```bash
bun run inspect:http
```

Both scripts open the Inspector web UI already connected to your server over the `2026-07-28` protocol revision.

## Adding Tools

Create a new file in `src/tools/` and register your tools:

```typescript
// src/tools/my-tools.ts
import type { McpServer } from '@modelcontextprotocol/server'

import * as z from 'zod'

export default function (server: McpServer) {
  server.registerTool(
    'greet',
    {
      title: 'Greet',
      description: 'Returns a greeting for the given name',
      inputSchema: z.object({
        name: z.string(),
      }),
    },
    async ({ name }) => {
      return {
        content: [{ type: 'text', text: `Hello, ${name}!` }],
      }
    },
  )
}
```

Then register it in `src/tools/index.ts`:

```typescript
import type { McpServer } from '@modelcontextprotocol/server'

import commonTools from './common'
import myTools from './my-tools'

export default function (server: McpServer) {
  commonTools(server)
  myTools(server)
}
```

## Environment Variables

| Variable | Default | Description                              |
| -------- | ------- | ---------------------------------------- |
| `PORT`   | `3000`  | HTTP server port (used by `src/http.ts`) |

Bun reads environment variables from `.env`, but:

- .env is resolved relative to the current working directory
- this may differ depending on how MCP is launched
- safest approach is to use real environment variables

## Debugging

When using **stdio** transport:

- ❌ Do NOT use `console.log`
- ✅ Use `console.error`

MCP uses **stdout** for protocol messages, so writing logs to stdout can break communication.

## Notes

- `index.ts` is for stdio
- `http.ts` is for HTTP
- Designed for Bun runtime
- Node.js may require changes

## License

MIT © Vladimir Kraikovskii
