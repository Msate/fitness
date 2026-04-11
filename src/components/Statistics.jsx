import { useState } from 'react'
import './Statistics.css'

function Statistics({ checkins, weights, onAddCheckin, onAddWeight }) {
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  const activities = [
    '🏃 跑步',
    '🚴 骑车',
    '🏋️ 健身房',
    '🧘 瑜伽',
    '🤸 家务',
    '⛹️ 篮球',
    '🏊 游泳',
    '🚶 散步'
  ]

  // 运动时间长度对应的基础卡路里消耗 (每分钟)
  const calorieMap = {
    '跑步': 12,
    '骑车': 10,
    '健身房': 8,
    '瑜伽': 4,
    '家务': 3,
    '篮球': 11,
    '游泳': 14,
    '散步': 5
  }

  const calculateCalories = (activity, minutes) => {
    const activityName = activity.replace(/^[^\s]+\s/, '')
    const baseCalorie = calorieMap[activityName] || 5
    return Math.round(baseCalorie * minutes)
  }

  const showToastMessage = (message, duration = 3000) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), duration)
  }

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

  const handleCheckinSubmit = (activity) => {
    if (activity && durationMinutes) {
      const activityName = activity.replace(/^[^\s]+\s/, '')
      const minutes = parseInt(durationMinutes) || 30
      const calories = calculateCalories(activity, minutes)
      
      onAddCheckin(activityName, minutes, calories)
      
      // 显示 toast 提示
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      let durationText = ''
      if (hours > 0) {
        durationText = `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
      } else {
        durationText = `${minutes}分钟`
      }
      showToastMessage(`运动了 ${durationText}，消耗 ${calories} 大卡`)
      
      setShowCheckinModal(false)
      setSelectedActivity('')
      setDurationMinutes('30')
    }
  }

  const handleWeightSubmit = () => {
    if (weightInput) {
      onAddWeight(weightInput, noteInput)
      setShowWeightModal(false)
      setWeightInput('')
      setNoteInput('')
    }
  }

  const latestWeight = weights.length > 0 ? weights[0].weight : null
  const todayCheckins = getTodayCheckins()
  const weekCheckins = getThisWeekCheckins()

  return (
    <div className="statistics">
      {/* 今日打卡卡片 */}
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <p className="stat-label">今日运动</p>
          <div className="stat-content">
            <span className="stat-value">{todayCheckins}</span>
            <span className="stat-detail">次</span>
            <button 
              className="stat-action-btn"
              onClick={() => setShowCheckinModal(true)}
            >
              打卡
            </button>
          </div>
        </div>
      </div>

      {/* 本周打卡卡片 */}
      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <p className="stat-label">本周打卡</p>
          <p className="stat-value">{weekCheckins}</p>
          <p className="stat-detail">次</p>
        </div>
      </div>

      {/* 最新体重卡片 */}
      <div className="stat-card">
        <div className="stat-icon">⚖️</div>
        <div className="stat-info">
          <p className="stat-label">最新体重</p>
          <div className="stat-content">
            <span className="stat-value">{latestWeight || '--'}</span>
            <span className="stat-detail">kg</span>
            <button 
              className="stat-action-btn"
              onClick={() => setShowWeightModal(true)}
            >
              {latestWeight ? '更新' : '记录'}
            </button>
          </div>
        </div>
      </div>

      {/* 打卡模态框 */}
      {showCheckinModal && (
        <div className="modal-overlay" onClick={() => setShowCheckinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>选择运动项目</h2>
              <button className="modal-close" onClick={() => setShowCheckinModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="activity-grid">
                {activities.map((activity, idx) => (
                  <button
                    key={idx}
                    className={`activity-btn ${selectedActivity === activity ? 'active' : ''}`}
                    onClick={() => setSelectedActivity(activity)}
                  >
                    {activity}
                  </button>
                ))}
              </div>
              
              {selectedActivity && (
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>运动时长（分钟）</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      min="1"
                      max="300"
                      placeholder="输入分钟数"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      约消耗 {calculateCalories(selectedActivity, parseInt(durationMinutes) || 0)} 大卡
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowCheckinModal(false)}
              >
                取消
              </button>
              <button 
                className="btn-submit"
                onClick={() => handleCheckinSubmit(selectedActivity)}
                disabled={!selectedActivity || !durationMinutes}
              >
                确定打卡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {showToast && (
        <div className="toast">
          {toastMessage}
        </div>
      )}

      {/* 记录体重模态框 */}
      {showWeightModal && (
        <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>记录体重</h2>
              <button className="modal-close" onClick={() => setShowWeightModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>体重 (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="输入体重"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>备注（可选）</label>
                <textarea 
                  placeholder="记录任何想说的..."
                  rows="3"
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowWeightModal(false)}
              >
                取消
              </button>
              <button 
                className="btn-submit"
                onClick={handleWeightSubmit}
                disabled={!weightInput}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistics
