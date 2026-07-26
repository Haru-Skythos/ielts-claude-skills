// 从 /api/data 的原始数据派生所有图表数据。
// 换算表和「今日建议」算法与 /ielts、/ielts-plan skill 保持一致。

export const SUBJECTS = [
  { key: 'listening', label: '听力' },
  { key: 'reading', label: '阅读' },
  { key: 'writing', label: '写作' },
  { key: 'speaking', label: '口语' },
]

// Academic 换算表（与 ielts/SKILL.md 一致）
const LISTENING_TABLE = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5],
]
const READING_TABLE = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5],
]
function rawToBand(table, score) {
  for (const [min, band] of table) if (score >= min) return band
  return 4.5
}
export const listeningBand = (s) => rawToBand(LISTENING_TABLE, s)
export const readingBand = (s) => rawToBand(READING_TABLE, s)

export function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function daysBetween(a, b) {
  return Math.ceil((new Date(b) - new Date(a)) / 86400000)
}

const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)
const valid = (records) => (records || []).filter((r) => r.date && !r.parse_error)

// 写作趋势：按日期排序的 overall + 四维
export function writingTrend(writing) {
  return valid(writing)
    .filter((r) => r.band && typeof r.band.overall === 'number')
    .sort(byDate)
    .map((r) => ({
      date: r.date.slice(5),
      fullDate: r.date,
      overall: r.band.overall,
      TR: r.band.tr,
      CC: r.band.cc,
      LR: r.band.lr,
      GRA: r.band.gra,
    }))
}

// 各科「最近水平」：优先最近的整卷/评分记录，回退 profile.current
export function latestLevels(data) {
  const prof = data.profile?.current || {}
  const lastFull = (records, isFull) => {
    const list = valid(records).sort(byDate)
    for (let i = list.length - 1; i >= 0; i--) if (isFull(list[i])) return list[i]
    return null
  }
  const lis = lastFull(data.listening, (r) => r.total === 40 && typeof r.score === 'number')
  const rea = lastFull(data.reading, (r) => r.total === 40 && typeof r.score === 'number')
  const wri = valid(data.writing)
    .filter((r) => r.band?.overall != null)
    .sort(byDate)
    .at(-1)
  const spk = valid(data.speaking)
    .filter((r) => r.self_band != null)
    .sort(byDate)
    .at(-1)
  return {
    listening: lis ? { band: listeningBand(lis.score), src: `${lis.source} ${lis.score}/40` }
      : prof.listening != null ? { band: prof.listening, src: 'profile 自评' } : null,
    reading: rea ? { band: readingBand(rea.score), src: `${rea.source} ${rea.score}/40` }
      : prof.reading != null ? { band: prof.reading, src: 'profile 自评' } : null,
    writing: wri ? { band: wri.band.overall, src: `${wri.date} 批改` }
      : prof.writing != null ? { band: prof.writing, src: 'profile 自评' } : null,
    speaking: spk ? { band: spk.self_band, src: `${spk.date} 练习` }
      : prof.speaking != null ? { band: prof.speaking, src: 'profile 自评' } : null,
  }
}

// 雷达图数据：现状 vs 目标
export function radarData(data) {
  const levels = latestLevels(data)
  const target = data.profile?.target_band ?? null
  return SUBJECTS.map(({ key, label }) => ({
    subject: label,
    current: levels[key]?.band ?? 0,
    hasData: levels[key] != null,
    target: target ?? 0,
  }))
}

// 聚合 error_tags（带科目归属）
export function errorCounts(data) {
  const buckets = [
    ['writing', data.writing],
    ['reading', data.reading],
    ['listening', data.listening],
    ['speaking', data.speaking],
  ]
  const map = new Map()
  for (const [subject, records] of buckets) {
    for (const r of valid(records)) {
      for (const tag of r.error_tags || []) {
        const cur = map.get(tag) || { tag, count: 0, subjects: {} }
        cur.count++
        cur.subjects[subject] = (cur.subjects[subject] || 0) + 1
        map.set(tag, cur)
      }
    }
  }
  return [...map.values()]
    .map((e) => ({ ...e, subject: Object.entries(e.subjects).sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.count - a.count)
}

// 热力图：最近 nWeeks 周 × Top 错误标签
export function errorHeatmap(data, nWeeks = 8, topN = 8) {
  const top = errorCounts(data).slice(0, topN)
  const today = new Date(todayStr())
  const weeks = []
  for (let i = nWeeks - 1; i >= 0; i--) {
    const end = new Date(today.getTime() - i * 7 * 86400000)
    const start = new Date(end.getTime() - 6 * 86400000)
    const fmt = (d) => d.toISOString().slice(0, 10)
    weeks.push({ start: fmt(start), end: fmt(end), label: `${fmt(end).slice(5)}` })
  }
  const records = ['writing', 'reading', 'listening', 'speaking'].flatMap((k) => valid(data[k]))
  const rows = top.map(({ tag, count }) => {
    const cells = weeks.map((w) => {
      let c = 0
      for (const r of records) {
        if (r.date >= w.start && r.date <= w.end && (r.error_tags || []).includes(tag)) c++
      }
      return c
    })
    return { tag, total: count, cells }
  })
  const max = Math.max(1, ...rows.flatMap((r) => r.cells))
  return { weeks, rows, max }
}

// 最近 14 天练习频次
export function activity(data, days = 14) {
  const cutoff = new Date(new Date(todayStr()).getTime() - (days - 1) * 86400000)
    .toISOString()
    .slice(0, 10)
  const count = (records) => valid(records).filter((r) => r.date >= cutoff).length
  return {
    writing: count(data.writing),
    reading: count(data.reading),
    listening: count(data.listening),
    speaking: count(data.speaking),
  }
}

// 今日建议（与 /ielts 的算法一致：差距最大且最近 3 天没练；并列选写作；考前 7 天保手感）
export function todaySuggestion(data) {
  const prof = data.profile
  if (!prof) return null
  const today = todayStr()
  const daysLeft = prof.exam_date ? daysBetween(today, prof.exam_date) : null
  if (daysLeft != null && daysLeft >= 0 && daysLeft <= 7) {
    return { subject: '听力 + 阅读', reason: `考前 ${daysLeft} 天：每天各一套保手感，写作口语只复习已有素材` }
  }
  const levels = latestLevels(data)
  const target = prof.target_band ?? 6.5
  const recent = new Date(new Date(today).getTime() - 2 * 86400000).toISOString().slice(0, 10)
  const practicedRecently = (records) => valid(records).some((r) => r.date >= recent)
  const prio = { writing: 4, listening: 3, reading: 2, speaking: 1 } // 并列时写作优先
  const scored = SUBJECTS.map(({ key, label }) => {
    const cur = levels[key]?.band
    const gap = cur == null ? target : target - cur // 无数据视为最大盲区
    return { key, label, gap, noData: cur == null, rested: !practicedRecently(data[key]) }
  }).sort(
    (a, b) =>
      Number(b.rested) - Number(a.rested) || b.gap - a.gap || prio[b.key] - prio[a.key],
  )
  const pick = scored[0]
  const reason = pick.noData
    ? `${pick.label}还没有任何记录，先测一次基线`
    : `差距 ${pick.gap > 0 ? pick.gap.toFixed(1) : 0} 分${pick.rested ? '，且最近 3 天没练' : ''}`
  return { subject: pick.label, reason }
}

// 词汇统计
export function vocabStats(data) {
  const today = todayStr()
  const active = data.words?.active || []
  const boxes = [1, 2, 3, 4, 5].map((b) => active.filter((w) => w.box === b).length)
  return {
    synonyms: data.synonyms?.pairs?.length || 0,
    words: active.length,
    mastered: data.words?.mastered?.length || 0,
    dueToday: active.filter((w) => w.next_review && w.next_review <= today).length,
    boxes,
  }
}
