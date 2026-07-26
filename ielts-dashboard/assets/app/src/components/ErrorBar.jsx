import React from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts'
import { errorCounts } from '../lib/derive.js'

// 颜色跟随科目实体（固定映射，不按名次循环）
export const SUBJECT_COLORS = {
  listening: 'var(--series-1)',
  reading: 'var(--series-2)',
  writing: 'var(--series-3)',
  speaking: 'var(--series-4)',
}
const SUBJECT_LABELS = { listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }

export default function ErrorBar({ data }) {
  const rows = errorCounts(data).slice(0, 10)
  const present = [...new Set(rows.map((r) => r.subject))]

  return (
    <div className="card">
      <h2>高频错误 Top 10</h2>
      <p className="desc">按科目着色 · 这是错题本的聚合视图，标签含义见各 skill 的标签表</p>
      {rows.length === 0 ? (
        <div className="empty">还没有错误记录 — 练起来才有数据</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 30 + 40)}>
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 40 }} barCategoryGap="25%">
              <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} stroke="var(--baseline)" />
              <YAxis
                type="category"
                dataKey="tag"
                width={130}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="var(--baseline)"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value, _name, entry) => [
                  `${value} 次（${Object.entries(entry.payload.subjects)
                    .map(([s, n]) => `${SUBJECT_LABELS[s]} ${n}`)
                    .join(' · ')}）`,
                  '出现',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.tag} fill={SUBJECT_COLORS[r.subject]} />
                ))}
                <LabelList dataKey="count" position="right" style={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {present.map((s) => (
              <span key={s} style={{ marginRight: 14 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: SUBJECT_COLORS[s],
                    marginRight: 5,
                    verticalAlign: 'baseline',
                  }}
                />
                {SUBJECT_LABELS[s]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
