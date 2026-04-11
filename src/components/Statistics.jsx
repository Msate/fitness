import { useState } from 'react'
import './Statistics.css'

function Statistics({ checkins, weights, onAddCheckin, onAddWeight }) {
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState('')
  const [weightInput, setWeightInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

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
    if (activity) {
      onAddCheckin(activity.replace(/^[^\s]+\s/, ''))
      setShowCheckinModal(false)
      setSelectedActivity('')
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
          <p className="stat-label">今日打卡</p>
          <div className="stat-content">
            <span className="stat-value">{todayCheckins}</span>
            <span className="stat-detail">次</span>
            <button 
              className="stat-action-btn"
              onClick={() => setShowCheckinModal(true)}
            >
              {todayCheckins === 0 ? '去打卡' : '继续打卡'}
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
                disabled={!selectedActivity}
              >
                确定打卡
              </button>
            </div>
          </div>
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
