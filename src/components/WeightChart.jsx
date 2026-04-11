import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './WeightChart.css'

function WeightChart({ weights }) {
  const [timeRange, setTimeRange] = useState('7days')

  const getChartData = () => {
    if (weights.length === 0) return []

    const sortedWeights = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date))
    const now = new Date()
    let filteredData = []

    if (timeRange === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredData = sortedWeights.filter(w => new Date(w.date) >= weekAgo)
    } else if (timeRange === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filteredData = sortedWeights.filter(w => new Date(w.date) >= monthAgo)
    } else {
      filteredData = sortedWeights
    }

    return filteredData.map(w => ({
      date: new Date(w.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      weight: w.weight,
      fullDate: w.date
    }))
  }

  const data = getChartData()
  const currentWeight = weights.length > 0 ? weights[0].weight : null
  const avgWeight = data.length > 0 ? (data.reduce((sum, d) => sum + d.weight, 0) / data.length).toFixed(1) : null
  const minWeight = data.length > 0 ? Math.min(...data.map(d => d.weight)).toFixed(1) : null
  const maxWeight = data.length > 0 ? Math.max(...data.map(d => d.weight)).toFixed(1) : null

  if (data.length === 0) {
    return (
      <div className="weight-chart">
        <div className="chart-empty">📊 暂无体重数据</div>
      </div>
    )
  }

  return (
    <div className="weight-chart">
      <h3>📈 体重走势</h3>

      <div className="chart-tabs">
        <button
          className={`chart-tab ${timeRange === '7days' ? 'active' : ''}`}
          onClick={() => setTimeRange('7days')}
        >
          7日
        </button>
        <button
          className={`chart-tab ${timeRange === '30days' ? 'active' : ''}`}
          onClick={() => setTimeRange('30days')}
        >
          30日
        </button>
        <button
          className={`chart-tab ${timeRange === 'all' ? 'active' : ''}`}
          onClick={() => setTimeRange('all')}
        >
          至今
        </button>
      </div>

      <div className="chart-stats">
        <div className="stat">
          <div className="label">当前</div>
          <div className="value">{currentWeight}</div>
        </div>
        <div className="stat">
          <div className="label">平均</div>
          <div className="value">{avgWeight}</div>
        </div>
        <div className="stat">
          <div className="label">最低</div>
          <div className="value">{minWeight}</div>
        </div>
        <div className="stat">
          <div className="label">最高</div>
          <div className="value">{maxWeight}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#999"
          />
          <YAxis 
            domain="dataMin" 
            tick={{ fontSize: 12 }}
            stroke="#999"
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value) => `${value} kg`}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#667eea"
            strokeWidth={2}
            dot={{ fill: '#667eea', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeightChart
