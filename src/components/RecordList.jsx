import { useState } from 'react'
import './RecordList.css'

function RecordList({ checkins, weights, onDeleteCheckin, onDeleteWeight }) {
  const [checkinPage, setCheckinPage] = useState(1)
  const itemsPerPage = 7

  const getCheckinData = () => {
    const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date))
    return sorted
  }

  const checkinData = getCheckinData()
  const totalCheckinPages = Math.ceil(checkinData.length / itemsPerPage)
  const checkinStart = (checkinPage - 1) * itemsPerPage
  const checkinEnd = checkinStart + itemsPerPage
  const paginatedCheckins = checkinData.slice(checkinStart, checkinEnd)

  return (
    <div className="record-list">
      <div className="records-section">
        <h3>💪 运动记录</h3>
        {checkinData.length === 0 ? (
          <p className="empty-message">还没有打卡记录，加油去运动吧！</p>
        ) : (
          <>
            <div className="records">
              {paginatedCheckins.map(checkin => (
                <div key={checkin.id} className="record-item checkin-item">
                  <div className="record-content">
                    <p className="record-activity">{checkin.activity}</p>
                    <p className="record-time">{checkin.date} {checkin.time}</p>
                    {(checkin.duration || checkin.calories) && (
                      <p className="record-detail">
                        {checkin.duration && `⏱️ ${checkin.duration}分钟`}
                        {checkin.duration && checkin.calories && ' · '}
                        {checkin.calories && `🔥 ${checkin.calories}大卡`}
                      </p>
                    )}
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

            {totalCheckinPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={checkinPage === 1}
                  onClick={() => setCheckinPage(checkinPage - 1)}
                >
                  ← 上一页
                </button>
                <span className="pagination-info">
                  {checkinPage} / {totalCheckinPages}
                </span>
                <button
                  className="pagination-btn"
                  disabled={checkinPage === totalCheckinPages}
                  onClick={() => setCheckinPage(checkinPage + 1)}
                >
                  下一页 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RecordList

