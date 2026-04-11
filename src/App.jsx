import { useState, useEffect } from 'react'
import './App.css'
import Statistics from './components/Statistics'
import WeightChart from './components/WeightChart'
import RecordList from './components/RecordList'

function App() {
  const [checkins, setCheckins] = useState([])
  const [weights, setWeights] = useState([])

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

  const addCheckin = (activity, durationMinutes = 30, calories = 0) => {
    const newCheckin = {
      id: Date.now(),
      activity,
      duration: durationMinutes,
      calories,
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
        <p>和老婆一起坚持</p>
      </header>

      <main className="main">
        <Statistics 
          checkins={checkins} 
          weights={weights}
          onAddCheckin={addCheckin}
          onAddWeight={addWeight}
        />
        <WeightChart weights={weights} />
        <RecordList 
          checkins={checkins} 
          weights={weights}
          onDeleteCheckin={deleteCheckin}
          onDeleteWeight={deleteWeight}
        />
      </main>
    </div>
  )
}

export default App

