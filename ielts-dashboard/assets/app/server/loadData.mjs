// 读取 IELTS 数据目录（IELTS_HOME 或 ~/.ielts），解析所有 md 的 frontmatter 和词表。
// 被 vite 中间件（/api/data）和 scripts/validate.mjs 共用。
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import matter from 'gray-matter'

export function dataRoot() {
  return process.env.IELTS_HOME || path.join(os.homedir(), '.ielts')
}

// gray-matter(js-yaml) 会把 YYYY-MM-DD 解析成 Date；统一转回字符串，前端和 zod 都只认字符串
function normalizeDates(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (Array.isArray(value)) return value.map(normalizeDates)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDates(v)
    return out
  }
  return value
}

export function readMd(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const parsed = matter(raw)
  return { fm: normalizeDates(parsed.data), content: parsed.content }
}

function listMd(dir) {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort()
    .map((f) => path.join(dir, f))
}

function readCollection(root, sub) {
  return listMd(path.join(root, sub)).map((file) => {
    try {
      const { fm } = readMd(file)
      return { file: path.basename(file), ...fm }
    } catch (e) {
      return { file: path.basename(file), parse_error: String(e && e.message ? e.message : e) }
    }
  })
}

// 解析 markdown 表格：返回 [{col: value}]，跳过表头分隔行
export function parseTable(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().startsWith('|'))
  const cells = lines.map((l) =>
    l
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim()),
  )
  if (cells.length < 2) return []
  const header = cells[0]
  return cells
    .slice(1)
    .filter((row) => !row.every((c) => /^:?-{2,}:?$/.test(c)))
    .map((row) => {
      const obj = {}
      header.forEach((h, i) => {
        obj[h] = row[i] ?? ''
      })
      return obj
    })
}

function readSynonyms(root) {
  const file = path.join(root, 'vocab', 'synonyms.md')
  if (!fs.existsSync(file)) return { exists: false, updated: null, pairs: [] }
  const { fm, content } = readMd(file)
  const rows = parseTable(content)
  const pairs = rows.map((r) => {
    const vals = Object.values(r)
    return {
      word: r['考点词'] ?? vals[0] ?? '',
      synonym: r['替换词'] ?? vals[1] ?? '',
      source: r['来源'] ?? vals[2] ?? '',
      date: r['日期'] ?? vals[3] ?? '',
    }
  })
  return { exists: true, updated: fm.updated ?? null, pairs }
}

function readWords(root) {
  const file = path.join(root, 'vocab', 'words.md')
  if (!fs.existsSync(file)) return { exists: false, updated: null, active: [], mastered: [] }
  const { fm, content } = readMd(file)
  const splitAt = content.indexOf('## 已掌握')
  const activePart = splitAt === -1 ? content : content.slice(0, splitAt)
  const masteredPart = splitAt === -1 ? '' : content.slice(splitAt)
  const toWord = (r) => {
    const vals = Object.values(r)
    return {
      word: r['词'] ?? vals[0] ?? '',
      meaning: r['释义与搭配'] ?? vals[1] ?? '',
      box: Number(r['box'] ?? vals[3] ?? 0) || 0,
      next_review: r['next_review'] ?? vals[4] ?? '',
      added: r['added'] ?? vals[5] ?? '',
      source: r['source'] ?? vals[6] ?? '',
    }
  }
  return {
    exists: true,
    updated: fm.updated ?? null,
    active: parseTable(activePart).map(toWord),
    mastered: parseTable(masteredPart).map(toWord),
  }
}

function readVocabLog(root) {
  const file = path.join(root, 'vocab', 'log.md')
  if (!fs.existsSync(file)) return { exists: false, updated: null, rows: [] }
  const { fm, content } = readMd(file)
  const rows = parseTable(content).map((r) => ({
    date: r['date'] ?? '',
    reviewed: Number(r['reviewed'] ?? 0) || 0,
    correct: Number(r['correct'] ?? 0) || 0,
    wrong: Number(r['wrong'] ?? 0) || 0,
  }))
  return { exists: true, updated: fm.updated ?? null, rows }
}

export function loadData() {
  const root = dataRoot()
  const initialized = fs.existsSync(path.join(root, 'profile.md'))
  let profile = null
  if (initialized) {
    try {
      profile = readMd(path.join(root, 'profile.md')).fm
    } catch (e) {
      profile = { parse_error: String(e && e.message ? e.message : e) }
    }
  }
  let plan = null
  if (fs.existsSync(path.join(root, 'plan.md'))) {
    try {
      plan = readMd(path.join(root, 'plan.md')).fm
    } catch {
      plan = null
    }
  }
  return {
    root,
    initialized,
    generatedAt: new Date().toISOString(),
    profile,
    plan,
    writing: readCollection(root, 'writing'),
    reading: readCollection(root, 'reading'),
    listening: readCollection(root, 'listening'),
    speaking: readCollection(root, 'speaking'),
    stories: readCollection(root, path.join('speaking', 'stories')),
    synonyms: readSynonyms(root),
    words: readWords(root),
    vocabLog: readVocabLog(root),
  }
}
