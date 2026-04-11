import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './Circle.css'

function Circle({ onBack, user }) {
  const [myCircles, setMyCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCircleId, setSelectedCircleId] = useState(null)
  const [rankTab, setRankTab] = useState('weight')
  const [rankings, setRankings] = useState({ weight: [], calories: [] })
  const [rankLoading, setRankLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [circleName, setCircleName] = useState('')
  const [circleSlogan, setCircleSlogan] = useState('')
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState(null)
  const [inviteInput, setInviteInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => { loadMyCircles() }, [])

  useEffect(() => {
    if (selectedCircleId) loadRankings(selectedCircleId)
  }, [selectedCircleId])

  const loadMyCircles = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('circle_members')
        .select('circle_id, circles(id, name, slogan, invite_code, created_by)')
        .eq('user_id', user.id)
      const circles = data || []
      setMyCircles(circles)
      if (circles.length > 0 && !selectedCircleId) {
        setSelectedCircleId(circles[0].circle_id)
      }
    } catch (err) {
      console.error('load circles failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRankings = async (circleId) => {
    setRankLoading(true)
    try {
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId)
      const userIds = (members || []).map(m => m.user_id)
      if (userIds.length === 0) { setRankings({ weight: [], calories: [] }); return }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)
      const profileMap = {}
      ;(profiles || []).forEach(p => { profileMap[p.id] = p.username })

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: weightsData } = await supabase
        .from('weights')
        .select('user_id, weight, date')
        .in('user_id', userIds)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true })

      const weightByUser = {}
      ;(weightsData || []).forEach(w => {
        if (!weightByUser[w.user_id]) weightByUser[w.user_id] = { first: w.weight, last: w.weight }
        else weightByUser[w.user_id].last = w.weight
      })

      const weightRank = userIds
        .filter(id => weightByUser[id])
        .map(id => ({
          username: profileMap[id] || id,
          isMe: id === user.id,
          loss: Number((weightByUser[id].first - weightByUser[id].last).toFixed(1))
        }))
        .sort((a, b) => b.loss - a.loss)

      const { data: checkinsData } = await supabase
        .from('checkins')
        .select('user_id, calories')
        .in('user_id', userIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const calByUser = {}
      ;(checkinsData || []).forEach(c => {
        calByUser[c.user_id] = (calByUser[c.user_id] || 0) + (c.calories || 0)
      })

      const calRank = userIds
        .map(id => ({
          username: profileMap[id] || id,
          isMe: id === user.id,
          calories: calByUser[id] || 0
        }))
        .sort((a, b) => b.calories - a.calories)

      setRankings({ weight: weightRank, calories: calRank })
    } catch (err) {
      console.error('load rankings failed:', err)
    } finally {
      setRankLoading(false)
    }
  }

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const handleCreate = async () => {
    if (!circleName.trim()) return
    setCreating(true)
    try {
      let inviteCode = generateInviteCode()
      let exists = true
      while (exists) {
        const { data } = await supabase.from('circles').select('id').eq('invite_code', inviteCode).maybeSingle()
        if (!data) exists = false
        else inviteCode = generateInviteCode()
      }
      const { data: circle, error } = await supabase
        .from('circles')
        .insert([{ name: circleName.trim(), slogan: circleSlogan.trim(), invite_code: inviteCode, created_by: user.id }])
        .select().single()
      if (error) throw error
      await supabase.from('circle_members').insert([{ circle_id: circle.id, user_id: user.id }])
      setCreateResult({ name: circle.name, inviteCode })
      setCircleName('')
      setCircleSlogan('')
      loadMyCircles()
    } catch (err) {
      console.error('create circle failed:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteInput.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const code = inviteInput.trim().toUpperCase()
      const { data: circle } = await supabase.from('circles').select('*').eq('invite_code', code).maybeSingle()
      if (!circle) { setJoinError('invite code not found'); return }
      const { data: existing } = await supabase.from('circle_members').select('id')
        .eq('circle_id', circle.id).eq('user_id', user.id).maybeSingle()
      if (existing) { setJoinError('already a member'); return }
      await supabase.from('circle_members').insert([{ circle_id: circle.id, user_id: user.id }])
      setInviteInput('')
      setShowJoinModal(false)
      loadMyCircles()
    } catch (err) {
      setJoinError('join failed, please retry')
    } finally {
      setJoining(false)
    }
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateResult(null)
    setCircleName('')
    setCircleSlogan('')
  }

  const selectedCircle = myCircles.find(m => m.circle_id === selectedCircleId)?.circles
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div className="circle-page">
      <header className="circle-header">
        <button className="circle-back-btn" onClick={onBack}>back</button>
        <h1>circle</h1>
        <div />
      </header>

      <main className="circle-main">
        <div className="circle-actions">
          <div className="circle-action-card" onClick={() => setShowJoinModal(true)}>
            <span className="circle-action-icon">join</span>
          </div>
          <div className="circle-action-card" onClick={() => setShowCreateModal(true)}>
            <span className="circle-action-icon">create</span>
          </div>
        </div>

        {!loading && myCircles.length > 0 && (
          <div>
            <div className="circle-tabs">
              {myCircles.map(m => (
                <button
                  key={m.circle_id}
                  className={selectedCircleId === m.circle_id ? 'circle-tab active' : 'circle-tab'}
                  onClick={() => setSelectedCircleId(m.circle_id)}
                >
                  {m.circles ? m.circles.name : ''}
                </button>
              ))}
            </div>

            {selectedCircle && (
              <div className="circle-detail-card">
                <div className="circle-detail-top">
                  <div>
                    <div className="circle-detail-name">{selectedCircle.name}</div>
                    {selectedCircle.slogan && (
                      <div className="circle-detail-slogan">{selectedCircle.slogan}</div>
                    )}
                  </div>
                  <div className="circle-detail-code">{selectedCircle.invite_code}</div>
                </div>
              </div>
            )}

            <div className="rank-tabs">
              <button
                className={rankTab === 'weight' ? 'rank-tab active' : 'rank-tab'}
                onClick={() => setRankTab('weight')}
              >
                7-day weight loss
              </button>
              <button
                className={rankTab === 'calories' ? 'rank-tab active' : 'rank-tab'}
                onClick={() => setRankTab('calories')}
              >
                7-day calories
              </button>
            </div>

            <div className="rank-list">
              {rankLoading && <p className="circle-hint">loading...</p>}
              {!rankLoading && rankTab === 'weight' && rankings.weight.length === 0 && (
                <p className="circle-hint">no weight data</p>
              )}
              {!rankLoading && rankTab === 'weight' && rankings.weight.length > 0 && rankings.weight.map((item, idx) => (
                <div key={idx} className={item.isMe ? 'rank-item rank-me' : 'rank-item'}>
                  <span className="rank-no" style={{ color: idx < 3 ? medalColors[idx] : '#555' }}>
                    {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : String(idx + 1)}
                  </span>
                  <span className="rank-name">{item.username}{item.isMe ? ' (me)' : ''}</span>
                  <span className="rank-value" style={{ color: item.loss > 0 ? '#4caf50' : item.loss < 0 ? '#ff6b6b' : '#888' }}>
                    {item.loss > 0 ? '-' + item.loss : item.loss < 0 ? '+' + Math.abs(item.loss) : '0'} kg
                  </span>
                </div>
              ))}
              {!rankLoading && rankTab === 'calories' && rankings.calories.length === 0 && (
                <p className="circle-hint">no exercise data</p>
              )}
              {!rankLoading && rankTab === 'calories' && rankings.calories.length > 0 && rankings.calories.map((item, idx) => (
                <div key={idx} className={item.isMe ? 'rank-item rank-me' : 'rank-item'}>
                  <span className="rank-no" style={{ color: idx < 3 ? medalColors[idx] : '#555' }}>
                    {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : String(idx + 1)}
                  </span>
                  <span className="rank-name">{item.username}{item.isMe ? ' (me)' : ''}</span>
                  <span className="rank-value">{item.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && myCircles.length === 0 && (
          <p className="circle-hint">no circles yet</p>
        )}
      </main>

      {showCreateModal && (
        <div className="circle-modal-overlay" onClick={closeCreateModal}>
          <div className="circle-modal" onClick={e => e.stopPropagation()}>
            {createResult ? (
              <div>
                <div className="circle-modal-header">
                  <h2>created</h2>
                  <button className="circle-modal-close" onClick={closeCreateModal}>X</button>
                </div>
                <div className="circle-modal-body">
                  <p className="circle-success-name">{createResult.name}</p>
                  <div className="circle-invite-code">{createResult.inviteCode}</div>
                  <button className="circle-primary-btn" onClick={closeCreateModal}>done</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="circle-modal-header">
                  <h2>create circle</h2>
                  <button className="circle-modal-close" onClick={closeCreateModal}>X</button>
                </div>
                <div className="circle-modal-body">
                  <div className="circle-form-group">
                    <label>name</label>
                    <input type="text" value={circleName} onChange={e => setCircleName(e.target.value)} maxLength={20} />
                  </div>
                  <div className="circle-form-group">
                    <label>slogan</label>
                    <input type="text" value={circleSlogan} onChange={e => setCircleSlogan(e.target.value)} maxLength={30} />
                  </div>
                  <button className="circle-primary-btn" onClick={handleCreate} disabled={!circleName.trim() || creating}>
                    {creating ? '...' : 'create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="circle-modal-overlay" onClick={() => { setShowJoinModal(false); setJoinError(''); setInviteInput('') }}>
          <div className="circle-modal" onClick={e => e.stopPropagation()}>
            <div className="circle-modal-header">
              <h2>join circle</h2>
              <button className="circle-modal-close" onClick={() => { setShowJoinModal(false); setJoinError(''); setInviteInput('') }}>X</button>
            </div>
            <div className="circle-modal-body">
              <div className="circle-form-group">
                <label>invite code</label>
                <input type="text" value={inviteInput}
                  onChange={e => { setInviteInput(e.target.value); setJoinError('') }}
                  maxLength={5}
                  style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }} />
              </div>
              {joinError && <p className="circle-error">{joinError}</p>}
              <button className="circle-primary-btn" onClick={handleJoin}
                disabled={inviteInput.trim().length !== 5 || joining}>
                {joining ? '...' : 'join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Circle
