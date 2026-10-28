#!/usr/bin/env bun
import { $, file, write } from 'bun'
import { cp, readdir, rename } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const templateRoot = join(import.meta.dir, '..')
const templatePkg = await file(join(templateRoot, 'package.json')).json()

const args = process.argv.slice(2)
const skipInstall = args.includes('--no-install')
const targetDir = args.find((arg) => !arg.startsWith('--')) ?? 'my-mcp-server'
const resolvedTargetDir = resolve(targetDir)
const projectName = basename(resolvedTargetDir)

// Generator-only package.json fields, scripts and devDependencies that make no sense in a new project
const generatorFields = [
  'bin',
  'version',
  'description',
  'author',
  'license',
  'repository',
  'homepage',
  'bugs',
  'keywords',
  'files',
  'engines',
]
const generatorScripts = ['lint', 'format', 'format:check', 'prepublishOnly']
const generatorDevDependencies = ['@eslint/js', 'eslint', 'globals', 'prettier', 'typescript-eslint']

console.log(`\n🚀 Creating new Bun MCP server in: ${targetDir}...\n`)

try {
  const existing = await readdir(resolvedTargetDir).catch((err: NodeJS.ErrnoException) => {
    if (err.code === 'ENOENT') return []
    throw err
  })
  if (existing.length > 0) throw new Error(`Directory "${targetDir}" already exists and is not empty.`)

  // Copy exactly what npm publishes, so a local run produces the same project as `bun create bun-mcp`
  for (const entry of templatePkg.files as string[]) {
    if (entry === 'bin') continue
    await cp(join(templateRoot, entry), join(resolvedTargetDir, entry), { recursive: true })
  }

  // npm drops .gitignore from published packages, so it ships under another name
  await rename(join(resolvedTargetDir, 'gitignore.template'), join(resolvedTargetDir, '.gitignore'))

  const pkg = { ...templatePkg, name: projectName }
  for (const field of generatorFields) delete pkg[field]
  for (const script of generatorScripts) delete pkg.scripts?.[script]
  for (const dependency of generatorDevDependencies) delete pkg.devDependencies?.[dependency]
  await write(join(resolvedTargetDir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`)

  const serverPath = join(resolvedTargetDir, 'src', 'server.ts')
  await write(serverPath, (await file(serverPath).text()).replace('bun-mcp-starter', projectName))

  if (!skipInstall) {
    console.log('📦 Installing dependencies...')
    await $`bun install`.cwd(resolvedTargetDir)
  }

  console.log('\n✅ Success! Your MCP server is ready.')
  console.log(`\nNext steps:`)
  console.log(`  cd ${targetDir}`)
  if (skipInstall) console.log(`  bun install`)
  console.log(`  bun run dev`)
  console.log(`\nHappy hacking!\n`)
} catch (err) {
  console.error('\n❌ Error creating project:', err)
  process.exit(1)
}
