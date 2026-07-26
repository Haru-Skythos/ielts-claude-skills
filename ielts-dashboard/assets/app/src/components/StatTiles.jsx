import React from 'react'
import { daysBetween, todayStr, todaySuggestion, vocabStats } from '../lib/derive.js'

export default function StatTiles({ data }) {
  const prof = data.profile || {}
  const daysLeft = prof.exam_date ? daysBetween(todayStr(), prof.exam_date) : null
  const sug = todaySuggestion(data)
  const v = vocabStats(data)

  return (
    <div className="tiles">
      <div className="tile">
        <div className="label">距离考试</div>
        <div className="value">
          {daysLeft == null ? '—' : daysLeft < 0 ? '已考完' : daysLeft}
          {daysLeft != null && daysLeft >= 0 && <span className="unit">天</span>}
        </div>
        <div className="sub">{prof.exam_date || '考期未定，/ielts 里更新'}</div>
      </div>

      <div className="tile">
        <div className="label">目标总分</div>
        <div className="value">{prof.target_band ?? '—'}</div>
        <div className="sub">{prof.test_type === 'general' ? 'General Training' : 'Academic'}</div>
      </div>

      <div className="tile suggestion">
        <div className="label">今日建议</div>
        <div className="value" style={{ fontSize: 20 }}>
          {sug?.subject ?? '—'}
        </div>
        <div className="sub">{sug?.reason}</div>
      </div>

      <div className="tile">
        <div className="label">今日到期词汇</div>
        <div className="value">
          {v.dueToday}
          <span className="unit">/ {v.words} 词</span>
        </div>
        <div className="sub">已掌握 {v.mastered} · /ielts-vocab 复习</div>
      </div>

      <div className="tile">
        <div className="label">累计资产</div>
        <div className="value" style={{ fontSize: 20 }}>
          {v.synonyms} <span className="unit">替换对</span> · {(data.stories || []).length}{' '}
          <span className="unit">故事</span>
        </div>
        <div className="sub">
          批改 {(data.writing || []).length} 篇 · 阅读 {(data.reading || []).length} 次 · 听力{' '}
          {(data.listening || []).length} 次
        </div>
      </div>
    </div>
  )
}
