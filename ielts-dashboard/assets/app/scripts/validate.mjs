#!/usr/bin/env node
// 数据体检：用 zod 校验数据目录里所有 md 的 frontmatter + 词表结构。
// 用法：npm run validate   （数据根 = IELTS_HOME 或 ~/.ielts）
import fs from 'node:fs'
import path from 'node:path'
import { dataRoot, readMd, parseTable } from '../server/loadData.mjs'
import {
  profileSchema,
  planSchema,
  synonymsFmSchema,
  vocabFmSchema,
  collectionSchemas,
} from '../server/schema.mjs'

const root = dataRoot()
let pass = 0
let fail = 0
const problems = []

function report(rel, result) {
  if (result.ok) {
    pass++
    console.log(`  PASS  ${rel}`)
  } else {
    fail++
    console.log(`  FAIL  ${rel}`)
    for (const issue of result.issues) {
      console.log(`        - ${issue}`)
      problems.push(`${rel}: ${issue}`)
    }
  }
}

function zodCheck(schema, fm) {
  const r = schema.safeParse(fm)
  if (r.success) return { ok: true }
  return {
    ok: false,
    issues: r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  }
}

function checkFile(rel, schema) {
  const abs = path.join(root, rel)
  try {
    const { fm } = readMd(abs)
    report(rel, zodCheck(schema, fm))
    return fm
  } catch (e) {
    report(rel, { ok: false, issues: [`无法解析：${e.message}`] })
    return null
  }
}

function checkCollection(sub) {
  const dir = path.join(root, sub)
  if (!fs.existsSync(dir)) return
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .sort()
  for (const f of files) checkFile(path.join(sub, f).replaceAll('\\', '/'), collectionSchemas[sub])
}

console.log(`IELTS v3 数据体检`)
console.log(`数据目录：${root}\n`)

if (!fs.existsSync(root)) {
  console.log('数据目录不存在。先运行 /ielts 完成初始化。')
  process.exit(0)
}

if (fs.existsSync(path.join(root, 'profile.md'))) {
  checkFile('profile.md', profileSchema)
} else {
  console.log('  WARN  profile.md 不存在（还没初始化？运行 /ielts）')
}
if (fs.existsSync(path.join(root, 'plan.md'))) checkFile('plan.md', planSchema)

for (const sub of ['writing', 'reading', 'listening', path.join('speaking', 'stories'), 'speaking']) {
  // speaking 目录下只查文件，stories 子目录单独查过了
  if (sub === 'speaking') {
    const dir = path.join(root, 'speaking')
    if (!fs.existsSync(dir)) continue
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.md'))
      .map((d) => d.name)
      .sort()
    for (const f of files) checkFile(`speaking/${f}`, collectionSchemas['speaking'])
  } else {
    checkCollection(sub.replaceAll('\\', '/'))
  }
}

// 词表文件：frontmatter + 表格结构
const synFile = path.join(root, 'vocab', 'synonyms.md')
if (fs.existsSync(synFile)) {
  const fm = checkFile('vocab/synonyms.md', synonymsFmSchema)
  if (fm) {
    const rows = parseTable(readMd(synFile).content)
    const bad = rows.filter((r) => Object.values(r).filter((v) => v !== '').length < 2)
    if (bad.length) {
      fail++
      console.log(`  FAIL  vocab/synonyms.md 表格：${bad.length} 行缺少必要列`)
    } else {
      console.log(`        表格 ${rows.length} 对替换，结构正常`)
    }
  }
}

const wordsFile = path.join(root, 'vocab', 'words.md')
if (fs.existsSync(wordsFile)) {
  const fm = checkFile('vocab/words.md', vocabFmSchema)
  if (fm) {
    // 「## 已掌握」之后是毕业词表，box/next_review 不再滚动，只校验主表
    const content = readMd(wordsFile).content
    const splitAt = content.indexOf('## 已掌握')
    const rows = parseTable(splitAt === -1 ? content : content.slice(0, splitAt))
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    const badRows = []
    rows.forEach((r, i) => {
      const vals = Object.values(r)
      const box = Number(r['box'] ?? vals[3])
      const next = r['next_review'] ?? vals[4] ?? ''
      if (!(box >= 1 && box <= 5) || !dateRe.test(next)) badRows.push(i + 1)
    })
    if (badRows.length) {
      fail++
      console.log(`  FAIL  vocab/words.md 表格：第 ${badRows.join(', ')} 行 box(1-5) 或 next_review 日期非法`)
      problems.push(`vocab/words.md: 行 ${badRows.join(', ')} box 或 next_review 非法`)
    } else {
      console.log(`        表格 ${rows.length} 个词条，结构正常`)
    }
  }
}

console.log(`\n结果：${pass} PASS · ${fail} FAIL`)
if (fail > 0) {
  console.log('\n需要修复：')
  for (const p of problems) console.log(`  - ${p}`)
  process.exit(1)
}
