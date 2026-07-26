import React, { useEffect, useState } from 'react'
import StatTiles from './components/StatTiles.jsx'
import TrendChart from './components/TrendChart.jsx'
import SubjectRadar from './components/SubjectRadar.jsx'
import ErrorBar from './components/ErrorBar.jsx'
import Heatmap from './components/Heatmap.jsx'
import SynonymTable from './components/SynonymTable.jsx'
import ActivityCard from './components/ActivityCard.jsx'

export default function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/data')
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`)
        return r.json()
      })
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(String(e)))
  }, [])

  if (error)
    return (
      <div className="errorbox">
        <h2>数据加载失败</h2>
        <p>{error}</p>
        <p className="desc">
          常见原因：数据文件 frontmatter 格式不合规。回到 Claude Code 对
          <code>/ielts-dashboard</code> 说「检查数据」定位问题。
        </p>
      </div>
    )
  if (!data) return <div className="empty">加载中…</div>

  if (!data.initialized)
    return (
      <div className="errorbox" style={{ borderColor: 'var(--border)' }}>
        <h2>还没有备考数据</h2>
        <p>
          数据目录 <code>{data.root}</code> 尚未初始化。
        </p>
        <p>
          在 Claude Code 里运行 <code>/ielts</code> 完成摸底建档，批改第一篇作文后再回来看图。
        </p>
      </div>
    )

  return (
    <>
      <div className="header">
        <h1>IELTS v3 · 备考 Dashboard</h1>
        <span className="meta">数据目录 {data.root}</span>
      </div>

      <StatTiles data={data} />

      <div className="grid">
        <TrendChart data={data} />
        <SubjectRadar data={data} />
        <ErrorBar data={data} />
        <Heatmap data={data} />
        <ActivityCard data={data} />
        <SynonymTable data={data} />
      </div>

      <footer>
        本地数据，不上传任何服务器 · 生成于 {new Date(data.generatedAt).toLocaleString('zh-CN')} ·
        刷新页面重新读取
      </footer>
    </>
  )
}
