#!/usr/bin/env node
// 知识漂移 lint：检查同一知识的多份拷贝是否一致 + 文档里的相对路径引用是否存在。
// 零依赖，node >= 18。用法：node scripts/lint-sync.mjs（仓库根或任意目录均可）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const problems = []
const ok = (msg) => console.log(`  OK    ${msg}`)
const bad = (msg) => {
  console.log(`  FAIL  ${msg}`)
  problems.push(msg)
}

// ---------- helpers ----------

/** 解析 markdown 表格，返回 [{col: value}] */
function parseTable(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().startsWith('|'))
  const cells = lines.map((l) =>
    l.split('|').slice(1, -1).map((c) => c.trim()),
  )
  if (cells.length < 2) return []
  const header = cells[0]
  return cells
    .slice(1)
    .filter((row) => !row.every((c) => /^:?-{2,}:?$/.test(c)))
    .map((row) => {
      const obj = {}
      header.forEach((h, i) => (obj[h] = row[i] ?? ''))
      return obj
    })
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

// ---------- 1. raw -> band 换算表（4 份拷贝） ----------

// 权威：ielts/SKILL.md 的两张全量表。统一成 {minScore: band}。
// 「39-40 | 9.0」→ min=39；derive.js 的 [39, 9] → min=39。
function tableFromMd(content, sectionHeader) {
  const idx = content.indexOf(sectionHeader)
  if (idx === -1) throw new Error(`找不到章节「${sectionHeader}」`)
  const rest = content.slice(idx)
  const rows = parseTable(rest.split(/\n\*\*/)[0]).filter(
    (r) => /^\d+/.test(r[Object.keys(r)[0]]) && /^\d+(\.\d+)?$/.test(r.Band ?? ''),
  )
  const map = {}
  for (const r of rows) {
    const scoreKey = Object.keys(r)[0]
    const m = r[scoreKey].match(/^(\d+)/)
    const band = Number(r.Band ?? r.band ?? Object.values(r)[1])
    if (!m || Number.isNaN(band)) throw new Error(`换算表行无法解析：${JSON.stringify(r)}`)
    map[Number(m[1])] = band
  }
  return map
}

function tableFromInline(content, prefix) {
  // 单行版：「39-40→9.0 · 37-38→8.5 · …」
  const idx = content.indexOf(prefix)
  if (idx === -1) throw new Error(`找不到「${prefix.slice(0, 20)}…」`)
  const line = content.slice(idx).split(/\n/).find((l) => l.includes('→'))
  const map = {}
  for (const m of line.matchAll(/(\d+)-?\d*→(\d+(?:\.\d+)?)/g)) map[Number(m[1])] = Number(m[2])
  return map
}

function tableFromJs(content, varName) {
  const m = content.match(new RegExp(`${varName}\\s*=\\s*\\[([\\s\\S]*?)\\s*\\]\\s*\\n`))
  if (!m) throw new Error(`derive.js 里找不到 ${varName}`)
  const map = {}
  for (const pair of m[1].matchAll(/\[\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\]/g)) {
    map[Number(pair[1])] = Number(pair[2])
  }
  return map
}

function diffMaps(name, authoritative, other, otherName) {
  const diffs = []
  for (const [min, band] of Object.entries(authoritative)) {
    if (!(min in other)) diffs.push(`${otherName} 缺少 ${min} 分档（应为 ${band}）`)
    else if (other[min] !== band) diffs.push(`${otherName} ${min} 分档 = ${other[min]}，应为 ${band}`)
  }
  for (const min of Object.keys(other)) {
    if (!(min in authoritative)) diffs.push(`${otherName} 多出 ${min} 分档（权威表没有）`)
  }
  if (diffs.length) bad(`${name}: ${diffs.join('；')}`)
  else ok(`${name} 与权威一致`)
}

console.log('== 换算表（raw → band）==')
const ieltsSkill = read('ielts/SKILL.md')
const listeningAuthoritative = tableFromMd(ieltsSkill, '**听力：**')
const readingAuthoritative = tableFromMd(ieltsSkill, '**学术类阅读：**')

try {
  const derive = read('ielts-dashboard/assets/app/src/lib/derive.js')
  diffMaps('derive.js LISTENING_TABLE', listeningAuthoritative, tableFromJs(derive, 'LISTENING_TABLE'), 'LISTENING_TABLE')
  diffMaps('derive.js READING_TABLE', readingAuthoritative, tableFromJs(derive, 'READING_TABLE'), 'READING_TABLE')
} catch (e) {
  bad(`derive.js 换算表：${e.message}`)
}

try {
  const listeningSkill = read('ielts-listening/SKILL.md')
  diffMaps(
    'ielts-listening/SKILL.md 单行换算',
    listeningAuthoritative,
    tableFromInline(listeningSkill, '**Band 换算'),
    '单行版',
  )
} catch (e) {
  bad(`ielts-listening/SKILL.md 换算表：${e.message}`)
}

try {
  const planSkill = read('ielts-plan/SKILL.md')
  const planLine = tableFromInline(planSkill, '**换算表（Academic）**')
  // plan 摘要版只列了部分分档，只核对它声称的档位数值是否与权威一致（允许缺档，不允许错档）
  const wrong = Object.entries(planLine).filter(([min, band]) => listeningAuthoritative[min] !== band && readingAuthoritative[min] !== band)
  if (wrong.length) bad(`ielts-plan/SKILL.md 摘要换算: 错档 ${JSON.stringify(wrong)}（听读权威表均无此对应）`)
  else ok('ielts-plan/SKILL.md 摘要换算与权威一致（允许只列部分档位）')
} catch (e) {
  bad(`ielts-plan/SKILL.md 换算表：${e.message}`)
}

// ---------- 2. 错误标签集（4 个子 skill + DATA-SCHEMA §5） ----------

/** 从反引号包裹的 token 里挑 kebab-case 标签（排除含空格/中文/大写缩写句） */
function tagsFromBackticks(text) {
  const tags = new Set()
  for (const m of text.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)) tags.add(m[1])
  return tags
}

/** DATA-SCHEMA §5：按 ### 5.x 小节提取表格第一列标签 */
function tagsFromSchemaSection(content, section) {
  const idx = content.indexOf(section)
  const next = content.indexOf('### ', idx + 1)
  const chunk = content.slice(idx, next === -1 ? undefined : next)
  const tags = new Set()
  for (const row of parseTable(chunk)) {
    const key = Object.keys(row)[0]
    if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(row[key])) tags.add(row[key])
  }
  return tags
}

/** 子 skill：从「error_tags 从…选」提示段提取反引号标签 */
function tagsFromSkillPrompt(content, marker) {
  const idx = content.indexOf(marker)
  if (idx === -1) throw new Error(`找不到标记「${marker.slice(0, 15)}…」`)
  return tagsFromBackticks(content.slice(idx, idx + 1500))
}

console.log('\n== 错误标签集 ==')
const schemaDoc = read('docs/DATA-SCHEMA.md')
const authoritativeTags = {
  writing: tagsFromSchemaSection(schemaDoc, '### 5.1 写作'),
  reading: tagsFromSchemaSection(schemaDoc, '### 5.2 阅读'),
  listening: tagsFromSchemaSection(schemaDoc, '### 5.3 听力'),
  speaking: tagsFromSchemaSection(schemaDoc, '### 5.4 口语'),
}

const skillTagSources = [
  ['writing', 'ielts-writing/SKILL.md', 'error_tags 从下面的标准标签里选'],
  ['reading', 'ielts-reading/SKILL.md', 'error_tags 从这套标准标签里选'],
  ['listening', 'ielts-listening/SKILL.md', '错因标签（封闭集，归档用）'],
  ['speaking', 'ielts-speaking/SKILL.md', 'error_tags` 从这套里选'],
]

for (const [subject, file, marker] of skillTagSources) {
  try {
    const tags = tagsFromSkillPrompt(read(file), marker)
    const auth = authoritativeTags[subject]
    const missing = [...auth].filter((t) => !tags.has(t))
    const extra = [...tags].filter((t) => !auth.has(t))
    if (missing.length) bad(`${file} (${subject}): 缺少标签 ${missing.join(', ')}`)
    if (extra.length) bad(`${file} (${subject}): 多出标签 ${extra.join(', ')}`)
    if (!missing.length && !extra.length) ok(`${file} (${subject}) 标签集与 DATA-SCHEMA §5 一致`)
  } catch (e) {
    bad(`${file}: ${e.message}`)
  }
}

// ---------- 3. 文档相对路径存在性 ----------

console.log('\n== 文档路径引用 ==')
const pathRepos = ['README.md', 'docs/DATA-SCHEMA.md']
// 这些是「数据文件名 / 章节锚点」而非仓库路径，跳过
const pathAllowlist = new Set([
  'profile.md', 'plan.md', 'synonyms.md', 'words.md', 'SKILL.md',
  'vocab/synonyms.md', 'vocab/log.md',
])
const extRe = /\.(mjs|md|sh|cmd|js|jsx|json|html)$/

for (const file of pathRepos) {
  const content = read(file)
  const refs = new Set()
  for (const m of content.matchAll(/`([a-zA-Z0-9_][a-zA-Z0-9_./-]+)`/g)) {
    const p = m[1]
    if (!extRe.test(p) || pathAllowlist.has(p)) continue
    refs.add(p)
  }
  for (const p of [...refs].sort()) {
    if (fs.existsSync(path.join(ROOT, p))) ok(`${file} → ${p}`)
    else bad(`${file} 引用的路径不存在：${p}`)
  }
}

// ---------- 结果 ----------

console.log(`\n结果：${problems.length === 0 ? '全部一致 ✓' : `${problems.length} 处漂移`}`)
if (problems.length) {
  console.log('\n漂移清单：')
  for (const p of problems) console.log(`  - ${p}`)
  process.exit(1)
}
