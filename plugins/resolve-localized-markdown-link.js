const fs = require('node:fs')
const path = require('node:path')

module.exports = function resolveLocalizedMarkdownLink({ sourceFilePath, url }) {
  const fail = () => {
    throw new Error('Unresolved Markdown link in ' + sourceFilePath + ': ' + url)
  }
  if (process.env.DOCUSAURUS_CURRENT_LOCALE !== 'zh-Hans') return fail()
  const siteDir = path.resolve(__dirname, '..')
  const sourceDir = path.join(siteDir, 'docs')
  const translatedDir = path.join(siteDir, 'i18n/zh-Hans/docusaurus-plugin-content-docs/current')
  const sourceFile = path.resolve(siteDir, sourceFilePath)
  const inside = (dir, file) => {
    const relative = path.relative(dir, file)
    return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)
  }
  let originalSource
  if (inside(translatedDir, sourceFile)) {
    originalSource = path.join(sourceDir, path.relative(translatedDir, sourceFile))
  } else if (inside(sourceDir, sourceFile)) {
    originalSource = sourceFile
  } else return fail()
  const match = url.match(/^([^?#]+\.mdx?)([?#].*)?$/)
  if (!match || path.isAbsolute(match[1])) return fail()
  const target = path.resolve(path.dirname(originalSource), decodeURIComponent(match[1]))
  if (!inside(sourceDir, target) || !fs.existsSync(target)) return fail()
  const frontmatter = fs.readFileSync(target, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const slug = frontmatter?.[1].match(/^slug:\s*["']?(\/[^"'\r\n]*)["']?\s*$/m)?.[1]
  if (!slug) return fail()
  // Only resolve existing source documents, then let Docusaurus check the final route and anchor
  return '/freeswitch/zh-Hans' + (slug === '/' ? '/' : slug.replace(/\/$/, '') + '/') + (match[2] ?? '')
}
