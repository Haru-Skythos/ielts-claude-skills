import React from 'react'
import { errorHeatmap } from '../lib/derive.js'

// 顺序渐变：单蓝色 light→dark（sequential，热力图允许最浅步贴近底色）
const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']
const rampColor = (v, max) => RAMP[Math.min(RAMP.length - 1, Math.ceil((v / max) * (RAMP.length - 1)))]
const inkFor = (v, max) => ((v / max) * (RAMP.length - 1) >= 3 ? '#ffffff' : 'var(--text-primary)')

export default function Heatmap({ data }) {
  const { weeks, rows, max } = errorHeatmap(data)

  return (
    <div className="card">
      <h2>错题热力图 · 错误 × 周</h2>
      <p className="desc">最近 8 周，每格 = 该错误当周出现次数 · 越深越多</p>
      {rows.length === 0 ? (
        <div className="empty">还没有错误记录</div>
      ) : (
        <div
          className="heatmap"
          style={{ gridTemplateColumns: `minmax(110px, auto) repeat(${weeks.length}, 1fr)` }}
        >
          {rows.map((r) => (
            <React.Fragment key={r.tag}>
              <div className="rowlabel" title={`累计 ${r.total} 次`}>
                {r.tag}
              </div>
              {r.cells.map((v, i) => (
                <div
                  key={i}
                  className={`cell${v === 0 ? ' zero' : ''}`}
                  style={v > 0 ? { background: rampColor(v, max), color: inkFor(v, max) } : undefined}
                  title={`${r.tag} · ${weeks[i].start} ~ ${weeks[i].end}：${v} 次`}
                >
                  {v > 0 ? v : ''}
                </div>
              ))}
            </React.Fragment>
          ))}
          <div />
          {weeks.map((w) => (
            <div key={w.label} className="collabel">
              {w.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
