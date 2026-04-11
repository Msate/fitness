import { useState } from 'react'
import './WeightForm.css'

function WeightForm({ onSubmit }) {
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (weight.trim()) {
      onSubmit(weight, note)
      setWeight('')
      setNote('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 2000)
    }
  }

  return (
    <div className="form-container weight-form">
      <h2>⚖️ 记录体重</h2>
      {submitted && <div className="success-message">✨ 记录成功！</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="weight">体重 (kg)</label>
          <input
            id="weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="输入你的体重..."
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">备注 (可选)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如: 早上刚起床，没吃早饭..."
            className="input-field textarea"
            rows="4"
          />
        </div>

        <button type="submit" className="submit-btn">记录</button>
      </form>

      <div className="tips">
        <h3>💡 小贴士</h3>
        <ul>
          <li>建议每天固定时间称重，最好是早上刚起床时</li>
          <li>每周查看一次平均体重变化，而不是每天</li>
          <li>体重会因水分、进食时间等波动，不用过度焦虑</li>
        </ul>
      </div>
    </div>
  )
}

export default WeightForm
