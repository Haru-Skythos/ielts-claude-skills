import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { writingTrend } from '../lib/derive.js'

const tooltipStyle = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text-primary)',
}

// 分类色按固定槽位顺序分配：overall=1 TR=2 CC=3 LR=4 GRA=5（不循环）
const SERIES = [
  { key: 'overall', color: 'var(--series-1)', width: 2.5 },
  { key: 'TR', color: 'var(--series-2)', width: 1.5 },
  { key: 'CC', color: 'var(--series-3)', width: 1.5 },
  { key: 'LR', color: 'var(--series-4)', width: 1.5 },
  { key: 'GRA', color: 'var(--series-5)', width: 1.5 },
]

export default function TrendChart({ data }) {
  const rows = writingTrend(data.writing)
  return (
    <div className="card">
      <h2>写作分数走势</h2>
      <p className="desc">overall 加粗；TR/CC/LR/GRA 细线（AI 评分普遍偏高 0.5，看趋势别看绝对值）</p>
      {rows.length === 0 ? (
        <div className="empty">
          还没有批改记录 — 用 <code>/ielts-writing</code> 批改第一篇作文
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--baseline)" />
            <YAxis
              domain={[4, 9]}
              ticks={[4, 5, 6, 7, 8, 9]}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              stroke="var(--baseline)"
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-secondary)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={s.width}
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
