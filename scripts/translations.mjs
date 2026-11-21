import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const sourceDir = path.join(root, 'docs')
const translatedDir = path.join(root, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current')
const manifestPath = path.join(root, 'i18n/zh-Hans/translation-manifest.json')
const [command = 'status', ...selected] = process.argv.slice(2)
const hash = text => createHash('sha256').update(text).digest('hex')
async function readOptional(file) {
  try { return await readFile(file, 'utf8') }
  catch (error) { if (error.code === 'ENOENT') return null; throw error }
}
async function list(dir, prefix = '') {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const name = prefix + entry.name
    if (entry.isDirectory()) files.push(...await list(path.join(dir, entry.name), name + '/'))
    else if (/\.mdx?$/.test(name)) files.push(name)
  }
  return files.sort()
}
const files = await list(sourceDir)
const translations = await list(translatedDir)
const manifest = JSON.parse(await readOptional(manifestPath) ?? '{"version":1,"files":{}}')
const errors = []
function validate(name, source, target) {
  const blocks = text => [...text.matchAll(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm)].map(m => m[0])
  if (JSON.stringify(blocks(source)) !== JSON.stringify(blocks(target))) errors.push(name + ': 代码块发生变化')
  const links = text => [...text.matchAll(/\]\(([^)]+)\)|\bhref="([^"]+)"/g)].map(m => m[1] ?? m[2]).sort()
  if (JSON.stringify(links(source)) !== JSON.stringify(links(target))) errors.push(name + ': 链接发生变化')
  const frontmatter = text => text.split('---')[1] ?? ''
  for (const key of ['id', 'slug', 'sidebar_position']) {
    const value = text => frontmatter(text).match(new RegExp('^' + key + ':.*$', 'm'))?.[0]
    if (value(source) !== value(target)) errors.push(name + ': front matter 标识发生变化 ' + key)
  }
  if (/@@CODE\d+@@/.test(target)) errors.push(name + ': 存在未替换的代码占位符')
}
if (!['status', 'record', 'check'].includes(command)) throw new Error('用法: translations.mjs status|check|record [相对 docs 的文件路径...]')
if (command === 'record' && selected.length === 0) throw new Error('record 必须明确指定已完成翻译的文件，避免误确认过期译文')
for (const name of selected) {
  if (!files.includes(name)) throw new Error('无效的原文路径: ' + name)
}
const counts = { translated: 0, stale: 0, modified: 0, unrecorded: 0, missing: 0 }
for (const name of files) {
  const source = await readFile(path.join(sourceDir, name), 'utf8')
  const target = await readOptional(path.join(translatedDir, name))
  const sourceHash = hash(source)
  const translationHash = target === null ? null : hash(target)
  if (target !== null) validate(name, source, target)
  if (command === 'record' && selected.includes(name)) {
    if (target === null) errors.push(name + ': 译文不存在')
    else manifest.files[name] = { sourceHash, translationHash }
  }
  const record = manifest.files[name]
  const status = target === null ? 'missing'
    : !record ? 'unrecorded'
      : record.sourceHash !== sourceHash ? 'stale'
        : record.translationHash !== translationHash ? 'modified' : 'translated'
  counts[status]++
  if (['stale', 'modified', 'unrecorded'].includes(status)) {
    console.log(status + ': ' + name)
    if (command === 'check') errors.push(name + ': ' + status)
  }
}
for (const name of translations) if (!files.includes(name)) errors.push(name + ': 原文已删除或改名')
console.log(JSON.stringify({ total: files.length, ...counts }, null, 2))
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else if (command === 'record') {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log('已记录 ' + selected.length + ' 篇原文与译文 SHA-256')
}
