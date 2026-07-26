import React from 'react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { radarData, latestLevels } from '../lib/derive.js'

export default function SubjectRadar({ data }) {
  const rows = radarData(data)
  const levels = latestLevels(data)
  const missing = rows.filter((r) => !r.hasData).map((r) => r.subject)
  const hasAny = rows.some((r) => r.hasData)

  return (
    <div className="card">
      <h2>四科雷达 · 现状 vs 目标</h2>
      <p className="desc">
        {Object.entries(levels)
          .filter(([, v]) => v)
          .map(([k, v]) => `${{ listening: '听力', reading: '阅读', writing: '写作', speaking: '口语' }[k]} ${v.band}（${v.src}）`)
          .join(' · ') || '暂无任何科目数据'}
      </p>
      {!hasAny ? (
        <div className="empty">
          四科都还没有数据 — 从 <code>/ielts</code> 开始摸底
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={rows} outerRadius="72%">
              <PolarGrid stroke="var(--grid)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 9]} tickCount={4} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} stroke="var(--baseline)" />
              <Radar
                name="当前"
                dataKey="current"
                stroke="var(--series-1)"
                strokeWidth={2}
                fill="var(--series-1)"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
              <Radar
                name="目标"
                dataKey="target"
                stroke="var(--text-muted)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                fill="none"
                fillOpacity={0}
                isAnimationActive={false}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
          {missing.length > 0 && (
            <div className="warnrow">
              <span aria-hidden>⚠️</span> {missing.join('、')}还没有记录（图上显示为 0）——先补一次基线测试
            </div>
          )}
        </>
      )}
    </div>
  )
}
