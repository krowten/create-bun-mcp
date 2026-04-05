#!/usr/bin/env bun
import { $, file } from 'bun'
import { mkdir, writeFile, readdir, copyFile, stat, rename } from 'node:fs/promises'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Root directory for template files (project root when installed from npm)
const templateRoot = join(__dirname, '..')
const targetDir = process.argv[2] ?? 'my-mcp-server'
const resolvedTargetDir = join(process.cwd(), targetDir)
const projectName = basename(resolvedTargetDir)

console.log(`\n🚀 Creating new Bun MCP server in: ${targetDir}...\n`)

async function copyRecursive(src: string, dest: string) {
  if (src === resolvedTargetDir) return // Prevent infinite recursion during local testing

  const stats = await stat(src)
  if (stats.isDirectory()) {
    await mkdir(dest, { recursive: true })
    for (const file of await readdir(src)) {
      if (
        file === 'node_modules' ||
        file === '.git' ||
        file === 'bin' ||
        file === 'bun.lock' ||
        file === 'bun.lockb' ||
        file === '.DS_Store' ||
        file === '.prettierrc' ||
        file === '.prettierignore' ||
        file === 'eslint.config.mjs' ||
        join(src, file) === resolvedTargetDir // Another safety check for nested paths
      )
        continue
      await copyRecursive(join(src, file), join(dest, file))
    }
  } else {
    await copyFile(src, dest)
  }
}

try {
  // 0. Validation
  if (templateRoot === resolvedTargetDir) {
    throw new Error('Cannot create project inside the template directory itself!')
  }

  // 1. Check if target directory already exists
  try {
    const targetStat = await stat(resolvedTargetDir)
    if (targetStat.isDirectory()) {
      const files = await readdir(resolvedTargetDir)
      if (files.length > 0) {
        throw new Error(`Directory "${targetDir}" already exists and is not empty.`)
      }
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }

  // 2. Create directory and copy files
  await copyRecursive(templateRoot, targetDir)

  // 2.1 Rename gitignore.template → .gitignore (npm renames .gitignore to .npmignore on publish)
  await rename(join(targetDir, 'gitignore.template'), join(targetDir, '.gitignore'))

  // 3. Update name in package.json
  const pkgPath = join(targetDir, 'package.json')
  const pkg = await file(pkgPath).json()
  pkg.name = projectName
  // Remove generator-specific fields for the end user
  delete pkg.bin
  delete pkg.version
  delete pkg.description
  delete pkg.repository
  delete pkg.files
  delete pkg.keywords
  delete pkg.author
  delete pkg.license
  delete pkg.engines

  // Remove lint/format scripts and devDeps that rely on configs not included in the template
  delete pkg.scripts?.lint
  delete pkg.scripts?.format
  delete pkg.scripts?.['format:check']
  if (pkg.devDependencies) {
    delete pkg.devDependencies['@eslint/js']
    delete pkg.devDependencies.eslint
    delete pkg.devDependencies.globals
    delete pkg.devDependencies.prettier
    delete pkg.devDependencies['typescript-eslint']
  }

  await writeFile(pkgPath, JSON.stringify(pkg, null, 2))

  // 3.1 Update name in server.ts
  const serverPath = join(targetDir, 'src', 'server.ts')
  const serverContent = await file(serverPath).text()
  await writeFile(serverPath, serverContent.replace('bun-mcp-starter', projectName))

  // 4. Install dependencies
  process.chdir(targetDir)
  console.log('📦 Installing dependencies...')
  await $`bun install`

  console.log('\n✅ Success! Your MCP server is ready.')
  console.log(`\nNext steps:`)
  console.log(`  cd ${targetDir}`)
  console.log(`  bun run dev`)
  console.log(`\nHappy hacking!\n`)
} catch (err) {
  console.error('\n❌ Error creating project:', err)
  process.exit(1)
}
