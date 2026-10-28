import { serveStdio } from '@modelcontextprotocol/server/stdio'

import { createServer } from './server'

// Serves both the 2026-07-28 revision and 2025-era clients that open with `initialize`
serveStdio(createServer)
