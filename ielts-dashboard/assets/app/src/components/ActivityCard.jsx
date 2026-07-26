import React from 'react'
import { activity } from '../lib/derive.js'
import { SUBJECT_COLORS } from './ErrorBar.jsx'

const LABELS = { writing: '写作', reading: '阅读', listening: '听力', speaking: '口语' }

export default function ActivityCard({ data }) {
  const act = activity(data)
  const max = Math.max(1, ...Object.values(act))
  const idle = Object.entries(act)
    .filter(([, n]) => n === 0)
    .map(([k]) => LABELS[k])

  return (
    <div className="card">
      <h2>最近 14 天练习频次</h2>
      <p className="desc">断练的科目就是下一个丢分的科目</p>
      {Object.entries(act).map(([k, n]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
          <span style={{ width: 36, color: 'var(--text-secondary)', fontSize: 13 }}>{LABELS[k]}</span>
          <div style={{ flex: 1, background: 'var(--page)', borderRadius: 4, height: 14 }}>
            <div
              style={{
                width: `${(n / max) * 100}%`,
                minWidth: n > 0 ? 8 : 0,
                background: SUBJECT_COLORS[k],
                height: '100%',
                borderRadius: 4,
              }}
            />
          </div>
          <span style={{ width: 40, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{n} 次</span>
        </div>
      ))}
      {idle.length > 0 && (
        <div className="warnrow">
          <span aria-hidden>⚠️</span>
          <span>
            <strong>{idle.join('、')}</strong> 14 天没练了
          </span>
        </div>
      )}
    </div>
  )
}
