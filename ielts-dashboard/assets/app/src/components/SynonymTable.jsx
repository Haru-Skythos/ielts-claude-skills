import React, { useMemo, useState } from 'react'

const CAP = 300

export default function SynonymTable({ data }) {
  const [q, setQ] = useState('')
  const pairs = data.synonyms?.pairs || []
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return pairs
    return pairs.filter(
      (p) =>
        p.word.toLowerCase().includes(needle) ||
        p.synonym.toLowerCase().includes(needle) ||
        p.source.toLowerCase().includes(needle),
    )
  }, [pairs, q])
  const shown = filtered.slice(0, CAP)

  return (
    <div className="card span2">
      <h2>同义替换累计库（{pairs.length} 对）</h2>
      <p className="desc">来自阅读/听力/写作的跨篇积累 · 用 /ielts-vocab 做专项测验</p>
      {pairs.length === 0 ? (
        <div className="empty">
          还没有积累 — 做一篇 <code>/ielts-reading</code> 分析就会自动入库
        </div>
      ) : (
        <>
          <input
            className="search"
            placeholder="搜索词 / 替换词 / 来源…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>考点词</th>
                <th style={{ width: '26%' }}>替换词</th>
                <th>来源</th>
                <th style={{ width: 110 }}>日期</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p, i) => (
                <tr key={i}>
                  <td>{p.word}</td>
                  <td>{p.synonym}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.source}</td>
                  <td className="num">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > CAP && (
            <p className="desc" style={{ marginTop: 8 }}>
              只显示前 {CAP} 条（共 {filtered.length} 条命中）——继续输入缩小范围
            </p>
          )}
        </>
      )}
    </div>
  )
}
