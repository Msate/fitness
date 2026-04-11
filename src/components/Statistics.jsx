import './Statistics.css'

function Statistics({ checkins, weights }) {
  const getTodayCheckins = () => {
    const today = new Date().toLocaleDateString('zh-CN')
    return checkins.filter(c => c.date === today).length
  }

  const getThisWeekCheckins = () => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return checkins.filter(c => {
      const date = new Date(c.date)
      return date >= weekAgo
    }).length
  }

  const getWeightStats = () => {
    if (weights.length === 0) return null
    const sorted = [...weights].sort((a, b) => new Date(b.date) - new Date(a.date))
    const latest = sorted[0]
    let firstRecord = sorted[sorted.length - 1]
    
    // 如果有多于10条记录，使用最早的10条来计算周以上的变化
    if (sorted.length > 10) {
      firstRecord = sorted[Math.min(10, sorted.length - 1)]
    }
    
    const change = (firstRecord.weight - latest.weight).toFixed(1)
    return {
      current: latest.weight,
      change: change,
      total: firstRecord.weight - latest.weight
    }
  }

  const getTodayWeight = () => {
    const today = new Date().toLocaleDateString('zh-CN')
    return weights.find(w => w.date === today)
  }

  const weightStats = getWeightStats()
  const todayWeight = getTodayWeight()

  return (
    <div className="statistics">
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <p className="stat-label">今日打卡</p>
          <p className="stat-value">{getTodayCheckins()}</p>
          <p className="stat-detail">次</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <p className="stat-label">本周打卡</p>
          <p className="stat-value">{getThisWeekCheckins()}</p>
          <p className="stat-detail">次</p>
        </div>
      </div>

      {todayWeight ? (
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-info">
            <p className="stat-label">今日体重</p>
            <p className="stat-value">{todayWeight.weight}</p>
            <p className="stat-detail">kg</p>
          </div>
        </div>
      ) : null}

      {weightStats && (
        <div className="stat-card highlight">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <p className="stat-label">体重变化</p>
            <p className={`stat-value ${weightStats.change < 0 ? 'positive' : 'negative'}`}>
              {weightStats.change < 0 ? '↓' : '↑'} {Math.abs(weightStats.change)}
            </p>
            <p className="stat-detail">kg</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics
