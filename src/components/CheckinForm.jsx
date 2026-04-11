import { useState } from 'react'
import './CheckinForm.css'

function CheckinForm({ onSubmit }) {
  const [activity, setActivity] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activity.trim()) {
      onSubmit(activity)
      setActivity('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    }
  }

  const suggestions = [
    '🏃 跑步 30分钟',
    '🚴 骑车 45分钟',
    '🏋️ 健身房 1小时',
    '🧘 瑜伽 30分钟',
    '🤸 有氧操 20分钟',
    '🌊 游泳 30分钟',
    '⛹️ 篮球 1小时',
    '🚶 散步 40分钟'
  ]

  return (
    <div className="form-container">
      <h2>🎯 添加今日打卡</h2>
      {submitted && <div className="success-message">✨ 打卡成功！继续加油！</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="activity">运动内容</label>
          <input
            id="activity"
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="输入你今天做的运动..."
            className="input-field"
          />
        </div>
        <button type="submit" className="submit-btn">打卡</button>
      </form>

      <div className="suggestions">
        <p>快速添加:</p>
        <div className="suggestion-buttons">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              className="suggestion-btn"
              onClick={() => {
                setActivity(sug)
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CheckinForm
