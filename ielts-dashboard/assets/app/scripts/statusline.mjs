#!/usr/bin/env node
// Claude Code 状态栏脚本（零依赖）。输出一行备考状态。
// 配置到 ~/.claude/settings.json:
//   "statusLine": { "type": "command", "command": "node <此文件绝对路径>" }
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const root = process.env.IELTS_HOME || path.join(os.homedir(), '.ielts')
const profileFile = path.join(root, 'profile.md')

function localToday() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

try {
  if (!fs.existsSync(profileFile)) {
    console.log('IELTS v3 未初始化（/ielts）')
    process.exit(0)
  }
  const text = fs.readFileSync(profileFile, 'utf8')
  const target = (text.match(/^target_band:\s*([\d.]+)/m) || [])[1]
  const examDate = (text.match(/^exam_date:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1]

  const today = localToday()
  let daysPart = ''
  if (examDate) {
    const days = Math.ceil((new Date(examDate) - new Date(today)) / 86400000)
    daysPart = days >= 0 ? ` | 剩${days}天` : ' | 已考完'
  }

  const subjects = [
    ['writing', '写作'],
    ['reading', '阅读'],
    ['listening', '听力'],
    ['speaking', '口语'],
  ]
  const done = []
  for (const [dir, label] of subjects) {
    const d = path.join(root, dir)
    if (fs.existsSync(d) && fs.readdirSync(d).some((f) => f.startsWith(today))) done.push(label)
  }
  const todayPart = done.length ? `今日:${done.join('·')} ✓` : '今日:未练'

  console.log(`🎯IELTS ${target ?? '?'}${daysPart} | ${todayPart}`)
} catch {
  console.log('IELTS v3')
}
