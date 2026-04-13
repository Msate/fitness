import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './WeightChart.css'

function WeightChart({ weights }) {
  const [timeRange, setTimeRange] = useState('15days')

  const getChartData = () => {
    const now = new Date()

    if (weights.length === 0) {
      if (timeRange === '15days') {
        const dates = []
        for (let i = 14; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
          dates.push({ date: dateStr, weight: null, fullDate: date.toISOString().split('T')[0] })
        }
        return dates
      }
      return []
    }

    const sortedWeights = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date))

    if (timeRange === '15days') {
      const daysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      const filtered = sortedWeights.filter(w => new Date(w.date) >= daysAgo)
      const dataMap = {}
      filtered.forEach(w => {
        // 兼容 ISO 格式 (2026-04-11) 和 zh-CN 格式 (2026/4/11)
        const isoDate = w.date.includes('/') 
          ? new Date(w.date.replace(/\//g, '-')).toISOString().split('T')[0]
          : w.date
        dataMap[isoDate] = w.weight
      })
      const dates = []
      let lastKnownWeight = null
      // 查找15天范围之前最近的一条记录作为初始值
      const allSorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date))
      for (const w of allSorted) {
        const isoDate = w.date.includes('/')
          ? new Date(w.date.replace(/\//g, '-')).toISOString().split('T')[0]
          : w.date
        if (isoDate < daysAgo.toISOString().split('T')[0]) {
          lastKnownWeight = w.weight
        }
      }
      for (let i = 14; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
        const fullDate = date.toISOString().split('T')[0]
        if (dataMap[fullDate] !== undefined) {
          lastKnownWeight = dataMap[fullDate]
        }
        dates.push({ date: dateStr, weight: lastKnownWeight, fullDate })
      }
      return dates
    }

    return sortedWeights.map(w => ({
      date: new Date(w.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      weight: w.weight,
      fullDate: w.date
    }))
  }

  const data = getChartData()
  const dataWithValue = data.filter(d => d.weight !== null && d.weight !== undefined)

  const minWeight = dataWithValue.length > 0 ? Math.min(...dataWithValue.map(d => d.weight)) : null
  const maxWeight = dataWithValue.length > 0 ? Math.max(...dataWithValue.map(d => d.weight)) : null

  const CustomDotWithLabel = (props) => {
    const { cx, cy, payload } = props
    if (!payload || payload.weight === null || payload.weight === undefined) return null
    const isMin = payload.weight === minWeight
    const isMax = payload.weight === maxWeight
    const r = (isMin || isMax) ? 5 : 4
    const labelY = isMax ? cy - 12 : cy + 20
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="var(--accent-primary)" stroke="var(--bg-surface)" strokeWidth={isMin || isMax ? 2 : 1} />
        {(isMin || isMax) && (
          <text
            x={cx}
            y={labelY}
            textAnchor="middle"
            fontSize={11}
            fill="var(--accent-primary)"
            fontWeight="bold"
          >
            {payload.weight}
          </text>
        )}
      </g>
    )
  }

  const formatXAxis = (value, index) => {
    const len = data.length
    if (len <= 3) return value
    if (index === 0) return value
    if (index === Math.floor(len / 2)) return value
    if (index === len - 1) return value
    return ''
  }

  return (
    <div className="weight-chart">
      <h3>体重走势</h3>

      <div className="chart-tabs">
        <button
          className={`chart-tab ${timeRange === '15days' ? 'active' : ''}`}
          onClick={() => setTimeRange('15days')}
        >
          近15日
        </button>
        <button
          className={`chart-tab ${timeRange === 'all' ? 'active' : ''}`}
          onClick={() => setTimeRange('all')}
        >
          至今
        </button>
      </div>

      {dataWithValue.length === 0 ? (
        <div className="chart-empty">暂无体重数据</div>
      ) : (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 28, right: 30, left: -20, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            stroke="var(--border-color)"
            tickFormatter={formatXAxis}
          />
          <YAxis 
            domain={[dataMin => Math.floor(dataMin) - 1, dataMax => Math.ceil(dataMax) + 1]}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            stroke="var(--border-color)"
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--text-primary)'
            }}
            formatter={(value) => `${value}`}
            labelStyle={{ color: 'var(--text-secondary)' }}
            itemStyle={{ color: 'var(--accent-primary)' }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--accent-primary)"
            strokeWidth={2}
            connectNulls={true}
            dot={<CustomDotWithLabel />}
            activeDot={{ r: 6, fill: "var(--accent-primary)", stroke: "var(--bg-surface)" }}
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}

export default WeightChart
