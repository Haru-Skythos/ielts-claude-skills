// derive.js 单元测试：node --test scripts/
// 「今日建议」算法以 ielts/SKILL.md 的文档版为唯一规范。
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  subjectTargets,
  todaySuggestion,
  listeningBand,
  readingBand,
  vocabActivity,
  todayStr,
} from '../src/lib/derive.js'

// ---------- subjectTargets：5 个已知算例（ielts/SKILL.md「算分公式」） ----------
test('subjectTargets 已知算例', () => {
  assert.deepEqual(subjectTargets(6.0), { listening: 6.5, reading: 6.5, writing: 5, speaking: 5 })
  assert.deepEqual(subjectTargets(6.5), { listening: 7, reading: 7, writing: 5.5, speaking: 5.5 })
  assert.deepEqual(subjectTargets(7.0), { listening: 7.5, reading: 7.5, writing: 6, speaking: 6 })
  assert.deepEqual(subjectTargets(7.5), { listening: 8, reading: 8, writing: 6.5, speaking: 6.5 })
  assert.deepEqual(subjectTargets(8.0), { listening: 8.5, reading: 8.5, writing: 7, speaking: 7 })
})

// ---------- todaySuggestion ----------

// 修复的行为差异点：差距是主键，rested 只是次键。
// 目标 7.0 → 听力配置 7.5、写作配置 6。写作 5.5（差距 0.5，最近练过），
// 听力 6.5（差距 1.0，3 天没练）→ 应建议听力。
// 注意：无数据科目按「配置−1」算差距（盲区最大），所以四科都要有数据才能隔离本行为。
function profileData(current, extra = {}) {
  return {
    profile: { target_band: 7.0, exam_date: null, ...extra },
    listening: [],
    reading: [],
    writing: [],
    speaking: [],
    ...extra.data,
  }
}

// 四科都有「最近水平」的基础数据（阅读 30/40→7.0、口语自评 6.0，差距小不干扰）
const baseRecords = {
  reading: [{ date: '2026-09-01', total: 40, score: 30, source: 'cam19' }],
  speaking: [{ date: '2026-09-01', self_band: 6.0 }],
}

test('todaySuggestion 差距优先于 rested：建议听力而非写作', () => {
  const data = profileData(null, {
    data: {
      ...baseRecords,
      writing: [{ date: '2026-09-08', band: { overall: 5.5 } }],
      listening: [{ date: '2026-09-01', total: 40, score: 26, source: 'cam19' }],
    },
  })
  const s = todaySuggestion(data)
  assert.equal(s.subject, '听力')
  assert.match(s.reason, /单科配置 7\.5/)
  assert.match(s.reason, /还差 1\.0/)
})

test('todaySuggestion 无任何记录：建议某科且 reason 提到基线', () => {
  const s = todaySuggestion(profileData(null))
  assert.ok(['听力', '阅读', '写作', '口语'].includes(s.subject))
  assert.match(s.reason, /基线/)
})

test('todaySuggestion 考前 3 天：听力+阅读保手感', () => {
  // exam_date 按真实时钟动态构造（今天 +3 天），避免固定日期随时间老化成时间炸弹
  const plus3 = new Date(new Date(todayStr()).getTime() + 3 * 86400000).toISOString().slice(0, 10)
  const data = profileData(null, { exam_date: plus3 })
  const s = todaySuggestion(data)
  assert.equal(s.subject, '听力 + 阅读')
  assert.match(s.reason, /考前 3 天/)
})

test('todaySuggestion 差距并列时选写作', () => {
  // 目标 7.0：听力/阅读配置 7.5，写作/口语配置 6。四科都有数据且差距相同：
  // 听力 6.5（差 1.0）、写作 5.0（差 1.0），阅读/口语差距更小 → 并列选写作。
  const data = profileData(null, {
    data: {
      ...baseRecords,
      listening: [{ date: '2026-09-01', total: 40, score: 26, source: 'cam19' }],
      writing: [{ date: '2026-09-01', band: { overall: 5.0 } }],
    },
  })
  const s = todaySuggestion(data)
  assert.equal(s.subject, '写作')
})

// ---------- 换算表 ----------
test('listeningBand / readingBand', () => {
  assert.equal(listeningBand(30), 7.0)
  assert.equal(readingBand(30), 7.0)
})

// ---------- subjectTargets 边界（4.0 / 9.0 特判为全科持平） ----------
test('subjectTargets 边界 4.0 与 9.0', () => {
  assert.deepEqual(subjectTargets(4.0), { listening: 4, reading: 4, writing: 4, speaking: 4 })
  assert.deepEqual(subjectTargets(9.0), { listening: 9, reading: 9, writing: 9, speaking: 9 })
})

// ---------- vocabActivity：天数按「有行的天数」算，同日多行只算一天 ----------
test('vocabActivity 同日多行只算一天', () => {
  const today = todayStr()
  const data = {
    vocabLog: {
      rows: [
        { date: today, reviewed: 10, correct: 8, wrong: 2 },
        { date: today, reviewed: 5, correct: 4, wrong: 1 },
        { date: '2026-01-01', reviewed: 3, correct: 3, wrong: 0 },
      ],
    },
  }
  assert.deepEqual(vocabActivity(data), { days: 1, reviewed: 15 })
})
