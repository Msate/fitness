import { useState, useEffect } from 'react'
import './App.css'
import Auth from './components/Auth'
import Statistics from './components/Statistics'
import WeightChart from './components/WeightChart'
import RecordList from './components/RecordList'
import { supabase } from './supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [userId, setUserId] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)

  // 检查本地登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setUserId(userData.id)
      loadUserData(userData.id)
    } else {
      setLoading(false)
    }
  }, [])

  // 从 Supabase 加载用户数据
  const loadUserData = async (id) => {
    try {
      // 加载打卡数据
      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      // 加载体重数据
      const { data: weightsData } = await supabase
        .from('weights')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      setCheckins(checkinsData || [])
      setWeights(weightsData || [])
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = (id, username) => {
    setUser({ id, username })
    setUserId(id)
    loadUserData(id)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setUserId(null)
    setCheckins([])
    setWeights([])
  }

  const addCheckin = async (activity, durationMinutes = 30, calories = 0) => {
    try {
      const newCheckin = {
        user_id: userId,
        activity,
        duration: durationMinutes,
        calories,
        date: new Date().toLocaleDateString('zh-CN'),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString()
      }

      const { data } = await supabase
        .from('checkins')
        .insert([newCheckin])
        .select()

      if (data && data.length > 0) {
        setCheckins([data[0], ...checkins])
      }
    } catch (err) {
      console.error('添加打卡失败:', err)
    }
  }

  const addWeight = async (weight, note) => {
    try {
      const newWeight = {
        user_id: userId,
        weight: parseFloat(weight),
        note,
        date: new Date().toLocaleDateString('zh-CN'),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        created_at: new Date().toISOString()
      }

      const { data } = await supabase
        .from('weights')
        .insert([newWeight])
        .select()

      if (data && data.length > 0) {
        setWeights([data[0], ...weights])
      }
    } catch (err) {
      console.error('添加体重失败:', err)
    }
  }

  const deleteCheckin = async (id) => {
    try {
      await supabase.from('checkins').delete().eq('id', id)
      setCheckins(checkins.filter(c => c.id !== id))
    } catch (err) {
      console.error('删除打卡失败:', err)
    }
  }

  const deleteWeight = async (id) => {
    try {
      await supabase.from('weights').delete().eq('id', id)
      setWeights(weights.filter(w => w.id !== id))
    } catch (err) {
      console.error('删除体重失败:', err)
    }
  }

  // 未登录时显示认证页面
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #00B5D8 0%, #0077B6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>加载中...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>💪 健身打卡</h1>
            <p>和老婆一起坚持</p>
          </div>
          <div className="header-user">
            <span className="username">{user.username}</span>
            <button className="logout-btn" onClick={handleLogout}>退出</button>
          </div>
        </div>
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

