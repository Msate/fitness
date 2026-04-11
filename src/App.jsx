import { useState, useEffect } from 'react'
import './App.css'
import CheckinForm from './components/CheckinForm'
import WeightForm from './components/WeightForm'
import RecordList from './components/RecordList'
import Statistics from './components/Statistics'

function App() {
  const [checkins, setCheckins] = useState([])
  const [weights, setWeights] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')

  // 从本地存储加载数据
  useEffect(() => {
    const savedCheckins = localStorage.getItem('checkins')
    const savedWeights = localStorage.getItem('weights')
    
    if (savedCheckins) setCheckins(JSON.parse(savedCheckins))
    if (savedWeights) setWeights(JSON.parse(savedWeights))
  }, [])

  // 保存打卡数据
  useEffect(() => {
    localStorage.setItem('checkins', JSON.stringify(checkins))
  }, [checkins])

  // 保存体重数据
  useEffect(() => {
    localStorage.setItem('weights', JSON.stringify(weights))
  }, [weights])

  const addCheckin = (activity) => {
    const newCheckin = {
      id: Date.now(),
      activity,
      date: new Date().toLocaleDateString('zh-CN'),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    setCheckins([newCheckin, ...checkins])
  }

  const addWeight = (weight, note) => {
    const newWeight = {
      id: Date.now(),
      weight: parseFloat(weight),
      note,
      date: new Date().toLocaleDateString('zh-CN'),
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    setWeights([newWeight, ...weights])
  }

  const deleteCheckin = (id) => {
    setCheckins(checkins.filter(c => c.id !== id))
  }

  const deleteWeight = (id) => {
    setWeights(weights.filter(w => w.id !== id))
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💪 健身打卡</h1>
        <p>老婆监督我减肥 - 坚持就是胜利!</p>
      </header>

      <nav className="nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 仪表板
        </button>
        <button 
          className={`nav-btn ${activeTab === 'checkin' ? 'active' : ''}`}
          onClick={() => setActiveTab('checkin')}
        >
          ✅ 打卡
        </button>
        <button 
          className={`nav-btn ${activeTab === 'weight' ? 'active' : ''}`}
          onClick={() => setActiveTab('weight')}
        >
          ⚖️ 体重
        </button>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && (
          <>
            <Statistics checkins={checkins} weights={weights} />
            <RecordList 
              checkins={checkins} 
              weights={weights}
              onDeleteCheckin={deleteCheckin}
              onDeleteWeight={deleteWeight}
            />
          </>
        )}
        
        {activeTab === 'checkin' && (
          <CheckinForm onSubmit={addCheckin} />
        )}
        
        {activeTab === 'weight' && (
          <WeightForm onSubmit={addWeight} />
        )}
      </main>
    </div>
  )
}

export default App
