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

  const getTodayWeight = () => {
    const today = new Date().toLocaleDateString('zh-CN')
    return weights.find(w => w.date === today)
  }

  const latestWeight = weights.length > 0 ? weights[0].weight : null
  const todayWeight = getTodayWeight()
  const todayCheckins = getTodayCheckins()
  const weekCheckins = getThisWeekCheckins()

  return (
    <div className="statistics">
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <p className="stat-label">今日打卡</p>
          <p className="stat-value">{todayCheckins}</p>
          <p className="stat-detail">次</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <p className="stat-label">本周打卡</p>
          <p className="stat-value">{weekCheckins}</p>
          <p className="stat-detail">次</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⚖️</div>
        <div className="stat-info">
          <p className="stat-label">最新体重</p>
          <p className="stat-value">{latestWeight || '--'}</p>
          <p className="stat-detail">kg</p>
        </div>
      </div>
    </div>
  )
}

export default Statistics
