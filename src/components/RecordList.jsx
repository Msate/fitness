import './RecordList.css'

function RecordList({ checkins, weights, onDeleteCheckin, onDeleteWeight }) {
  return (
    <div className="record-list">
      <div className="records-section">
        <h3>📋 最近的打卡记录</h3>
        {checkins.length === 0 ? (
          <p className="empty-message">还没有打卡记录，加油去运动吧！💪</p>
        ) : (
          <div className="records">
            {checkins.slice(0, 10).map(checkin => (
              <div key={checkin.id} className="record-item checkin-item">
                <div className="record-content">
                  <p className="record-activity">{checkin.activity}</p>
                  <p className="record-time">{checkin.date} {checkin.time}</p>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => onDeleteCheckin(checkin.id)}
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="records-section">
        <h3>⚖️ 最近的体重记录</h3>
        {weights.length === 0 ? (
          <p className="empty-message">还没有体重记录，开始记录吧！</p>
        ) : (
          <div className="records">
            {weights.slice(0, 10).map((weight, idx) => (
              <div key={weight.id} className="record-item weight-item">
                <div className="record-content">
                  <p className="record-weight">
                    <span className="weight-value">{weight.weight}</span> kg
                    {idx > 0 && (
                      <span className={`weight-change ${weights[idx - 1].weight > weight.weight ? 'down' : 'up'}`}>
                        {weights[idx - 1].weight > weight.weight ? '↓' : '↑'} {Math.abs((weights[idx - 1].weight - weight.weight).toFixed(1))} kg
                      </span>
                    )}
                  </p>
                  <p className="record-time">{weight.date} {weight.time}</p>
                  {weight.note && <p className="record-note">{weight.note}</p>}
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => onDeleteWeight(weight.id)}
                  title="删除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordList
