import { $, file } from 'bun'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const bin = join(import.meta.dir, '..', 'bin', 'index.ts')
let workDir: string

beforeAll(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'create-bun-mcp-'))
})
afterAll(() => rm(workDir, { recursive: true, force: true }))

describe('create-bun-mcp', () => {
  test('scaffolds a project without generator leftovers', async () => {
    await $`bun ${bin} my-app --no-install`.cwd(workDir).quiet()
    const project = join(workDir, 'my-app')

    expect((await readdir(project)).sort()).toEqual(['.gitignore', 'README.md', 'package.json', 'src', 'tsconfig.json'])

    const pkg = await file(join(project, 'package.json')).json()
    expect(pkg.name).toBe('my-app')
    for (const field of ['bin', 'version', 'repository', 'homepage', 'files', 'author'])
      expect(pkg).not.toHaveProperty(field)
    expect(pkg.scripts).not.toHaveProperty('prepublishOnly')
    expect(pkg.scripts).not.toHaveProperty('lint')
    expect(pkg.devDependencies).not.toHaveProperty('eslint')
    expect(pkg.devDependencies).toHaveProperty('@modelcontextprotocol/client')

    expect(await file(join(project, 'src', 'server.ts')).text()).toContain(`name: 'my-app'`)
  })

  test('refuses a non-empty directory', async () => {
    const result = await $`bun ${bin} my-app --no-install`.cwd(workDir).nothrow().quiet()
    expect(result.exitCode).toBe(1)
    expect(result.stderr.toString()).toContain('already exists and is not empty')
  })

  // The real thing: install from the registry, then typecheck and run the template's own tests
  test(
    'the generated project installs, typechecks and passes its tests',
    async () => {
      await $`bun ${bin} full-app`.cwd(workDir).quiet()
      const project = join(workDir, 'full-app')
      await $`bun run check`.cwd(project).quiet()
      await $`bun test`.cwd(project).quiet()
    },
    { timeout: 120_000 },
  )
})
