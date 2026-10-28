# Changelog

## 1.1.1

- README: create a project with `bun create bun-mcp`.

## 1.1.0

- The template speaks MCP protocol revision `2026-07-28` on stdio and HTTP and still serves 2025-era clients.
- The HTTP server is stateless (`createMcpHandler`) and rejects foreign browser origins.
- The template ships `bun test` tests that drive the server through a real MCP client over both transports, plus a
  `check` script for type checking.
- `inspect` scripts use MCP Inspector v2.
- New `--no-install` flag skips installing dependencies.
- A local run of the generator now copies exactly the files npm publishes, and generated projects no longer inherit
  the generator's `homepage` field.
- Dependencies updated to their latest versions (`@modelcontextprotocol/server` 2.4); the unused
  `@cfworker/json-schema` dependency is gone.

## 1.0.2

- Repository metadata.

## 1.0.1

- Initial release.
