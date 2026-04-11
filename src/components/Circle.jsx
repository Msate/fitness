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
  const [circleBaseDate, setCircleBaseDate] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
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
      // 获取圈子创建时间作为基准日期
      const { data: circleInfo } = await supabase
        .from('circles')
        .select('created_at')
        .eq('id', circleId)
        .single()
      const baseDate = circleInfo ? circleInfo.created_at.split('T')[0] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      setCircleBaseDate(baseDate)

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

      const { data: weightsData } = await supabase
        .from('weights')
        .select('user_id, weight, date')
        .in('user_id', userIds)
        .gte('date', baseDate)
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
        .gte('created_at', baseDate + 'T00:00:00Z')

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
      // 检查用户是否有体重记录
      const { data: weightCheck } = await supabase
        .from('weights')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (!weightCheck || weightCheck.length === 0) {
        setJoinError('加入圈子前，请先去首页记录一条体重数据！')
        return
      }
      const code = inviteInput.trim().toUpperCase()
      const { data: circle } = await supabase.from('circles').select('*').eq('invite_code', code).maybeSingle()
      if (!circle) { setJoinError('邀请码不存在，请检查后重试'); return }
      const { data: existing } = await supabase.from('circle_members').select('id')
        .eq('circle_id', circle.id).eq('user_id', user.id).maybeSingle()
      if (existing) { setJoinError('你已经在这个圈子里了'); return }
      await supabase.from('circle_members').insert([{ circle_id: circle.id, user_id: user.id }])
      setInviteInput('')
      setShowJoinModal(false)
      loadMyCircles()
    } catch (err) {
      setJoinError('加入失败，请重试')
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

  const handleLeaveCircle = async () => {
    if (!selectedCircleId) return
    try {
      await supabase.from('circle_members')
        .delete()
        .eq('circle_id', selectedCircleId)
        .eq('user_id', user.id)
      setSelectedCircleId(null)
      loadMyCircles()
    } catch (err) {
      console.error('leave circle failed:', err)
    }
  }

  const selectedCircle = myCircles.find(m => m.circle_id === selectedCircleId)?.circles
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']

  return (
    <div className="circle-page">
      <header className="circle-header">
        <button className="circle-back-btn" onClick={onBack}>返回</button>
        <h1>我的圈子</h1>
        <div />
      </header>

      <main className="circle-main">
        <div className="circle-actions">
          <div className="circle-action-card" onClick={() => setShowJoinModal(true)}>
            <span className="circle-action-label">加入圈子</span>
            <span className="circle-action-desc">输入邀请码加入</span>
          </div>
          <div className="circle-action-card" onClick={() => setShowCreateModal(true)}>
            <span className="circle-action-label">创建圈子</span>
            <span className="circle-action-desc">建立你的团队</span>
          </div>
        </div>

        {!loading && myCircles.length > 0 && selectedCircle && (
          <div className="circle-panel">
            <div className="circle-detail-top">
              <div className="circle-detail-name-group">
                <span className="circle-detail-name">{selectedCircle.name}</span>
                <span className="circle-detail-code-sub">邀请码：{selectedCircle.invite_code}</span>
              </div>
              {myCircles.length > 1 && (
                <button className="circle-switch-btn" onClick={() => setShowSwitchModal(true)}>切换</button>
              )}
            </div>

            <div className="circle-panel-divider" />

            <div className="rank-tabs">
              <button
                className={rankTab === 'weight' ? 'rank-tab active' : 'rank-tab'}
                onClick={() => setRankTab('weight')}
              >
                减重榜
              </button>
              <button
                className={rankTab === 'calories' ? 'rank-tab active' : 'rank-tab'}
                onClick={() => setRankTab('calories')}
              >
                消耗榜
              </button>
            </div>
            {circleBaseDate && (
              <p className="rank-base-date">自 {circleBaseDate} 圈子创建起</p>
            )}

            <div className="rank-list">
              {rankLoading && <p className="circle-hint">加载中...</p>}
              {!rankLoading && rankTab === 'weight' && rankings.weight.length === 0 && (
                <p className="circle-hint">圈子创建后暂无体重记录</p>
              )}
              {!rankLoading && rankTab === 'weight' && rankings.weight.length > 0 && (() => {
                const maxLoss = Math.max(...rankings.weight.map(i => Math.abs(i.loss)), 0.1)
                return rankings.weight.map((item, idx) => (
                  <div key={idx} className={item.isMe ? 'rank-item rank-me' : 'rank-item'}>
                    <span className="rank-no" style={{
                      background: idx === 0 ? 'rgba(255,215,0,0.15)' : idx === 1 ? 'rgba(192,192,192,0.15)' : idx === 2 ? 'rgba(205,127,50,0.15)' : 'transparent',
                      color: idx < 3 ? medalColors[idx] : '#444'
                    }}>{String(idx + 1)}</span>
                    <div className="rank-main">
                      <div className="rank-row">
                        <span className="rank-name">{item.username}{item.isMe ? ' (我)' : ''}</span>
                        <span className="rank-value" style={{ color: item.loss > 0 ? '#52c41a' : item.loss < 0 ? '#ff6b6b' : '#555' }}>
                          {item.loss > 0 ? '-' + item.loss : item.loss < 0 ? '+' + Math.abs(item.loss) : '--'} kg
                        </span>
                      </div>
                      <div className="rank-bar-bg">
                        <div className="rank-bar-fill" style={{ width: (Math.abs(item.loss) / maxLoss * 100) + '%', background: item.loss > 0 ? '#52c41a' : item.loss < 0 ? '#ff6b6b' : '#444' }} />
                      </div>
                    </div>
                  </div>
                ))
              })()}
              {!rankLoading && rankTab === 'calories' && rankings.calories.length === 0 && (
                <p className="circle-hint">圈子创建后暂无运动记录</p>
              )}
              {!rankLoading && rankTab === 'calories' && rankings.calories.length > 0 && (() => {
                const maxCal = Math.max(...rankings.calories.map(i => i.calories), 1)
                return rankings.calories.map((item, idx) => (
                  <div key={idx} className={item.isMe ? 'rank-item rank-me' : 'rank-item'}>
                    <span className="rank-no" style={{
                      background: idx === 0 ? 'rgba(255,215,0,0.15)' : idx === 1 ? 'rgba(192,192,192,0.15)' : idx === 2 ? 'rgba(205,127,50,0.15)' : 'transparent',
                      color: idx < 3 ? medalColors[idx] : '#444'
                    }}>{String(idx + 1)}</span>
                    <div className="rank-main">
                      <div className="rank-row">
                        <span className="rank-name">{item.username}{item.isMe ? ' (我)' : ''}</span>
                        <span className="rank-value">{item.calories > 0 ? item.calories + ' 大卡' : '--'}</span>
                      </div>
                      <div className="rank-bar-bg">
                        <div className="rank-bar-fill" style={{ width: (item.calories / maxCal * 100) + '%', background: '#d4af37' }} />
                      </div>
                    </div>
                  </div>
                ))
              })()}
            </div>

            <span className="circle-leave-text" onClick={() => setShowLeaveModal(true)}>退出圈子</span>
          </div>
        )}

        {!loading && myCircles.length === 0 && (
          <p className="circle-hint">还没有加入任何圈子，快去创建或加入吧！</p>
        )}
      </main>

      {showLeaveModal && (
        <div className="circle-modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="circle-modal circle-leave-modal" onClick={e => e.stopPropagation()}>
            <div className="circle-leave-modal-body">
              <div className="circle-leave-modal-icon">🎯</div>
              <p className="circle-leave-modal-title">再坚持一下，成功就在眼前！</p>
              <p className="circle-leave-modal-sub">确定要离开这个圈子吗？</p>
              <div className="circle-leave-modal-btns">
                <button className="circle-leave-modal-cancel" onClick={() => setShowLeaveModal(false)}>再想想</button>
                <button className="circle-leave-modal-confirm" onClick={() => { setShowLeaveModal(false); handleLeaveCircle() }}>就这样吧</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSwitchModal && (
        <div className="circle-modal-overlay" onClick={() => setShowSwitchModal(false)}>
          <div className="circle-modal" onClick={e => e.stopPropagation()}>
            <div className="circle-modal-header">
              <h2>选择圈子</h2>
              <button className="circle-modal-close" onClick={() => setShowSwitchModal(false)}>✕</button>
            </div>
            <div className="circle-switch-list">
              {myCircles.map(m => (
                <div
                  key={m.circle_id}
                  className={m.circle_id === selectedCircleId ? 'circle-switch-item active' : 'circle-switch-item'}
                  onClick={() => { setSelectedCircleId(m.circle_id); setShowSwitchModal(false) }}
                >
                  <div className="circle-switch-item-name">{m.circles ? m.circles.name : ''}</div>
                  {m.circles && m.circles.slogan && (
                    <div className="circle-switch-item-slogan">{m.circles.slogan}</div>
                  )}
                  {m.circle_id === selectedCircleId && (
                    <span className="circle-switch-check">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="circle-modal-overlay" onClick={closeCreateModal}>
          <div className="circle-modal" onClick={e => e.stopPropagation()}>
            {createResult ? (
              <div>
                <div className="circle-modal-header">
                  <h2>创建成功 🎉</h2>
                  <button className="circle-modal-close" onClick={closeCreateModal}>✕</button>
                </div>
                <div className="circle-modal-body">
                  <p className="circle-success-name">{createResult.name}</p>
                  <p className="circle-success-hint">把下方邀请码分享给小伙伴</p>
                  <div className="circle-invite-code">{createResult.inviteCode}</div>
                  <button className="circle-primary-btn" onClick={closeCreateModal}>完成</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="circle-modal-header">
                  <h2>创建圈子</h2>
                  <button className="circle-modal-close" onClick={closeCreateModal}>✕</button>
                </div>
                <div className="circle-modal-body">
                  <div className="circle-form-group">
                    <label>圈子名称（{circleName.length}/7）</label>
                    <input type="text" placeholder="给圈子起个名字" value={circleName} onChange={e => setCircleName(e.target.value)} maxLength={7} />
                  </div>
                  <div className="circle-form-group">
                    <label>圈子宣言（{circleSlogan.length}/20）</label>
                    <input type="text" placeholder="一句话激励大家（选填）" value={circleSlogan} onChange={e => setCircleSlogan(e.target.value)} maxLength={20} />
                  </div>
                  <button className="circle-primary-btn" onClick={handleCreate} disabled={!circleName.trim() || creating}>
                    {creating ? '创建中...' : '创建圈子'}
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
              <h2>加入圈子</h2>
              <button className="circle-modal-close" onClick={() => { setShowJoinModal(false); setJoinError(''); setInviteInput('') }}>✕</button>
            </div>
            <div className="circle-modal-body">
              <div className="circle-form-group">
                <label>邀请码</label>
                <input type="text" value={inviteInput}
                  onChange={e => { setInviteInput(e.target.value); setJoinError('') }}
                  maxLength={5}
                  style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontSize: '20px' }} />
              </div>
              {joinError && <p className="circle-error">{joinError}</p>}
              <button className="circle-primary-btn" onClick={handleJoin}
                disabled={inviteInput.trim().length !== 5 || joining}>
                {joining ? '加入中...' : '加入圈子'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Circle
