import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './Auth.css'

function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 简单的密码哈希（只用于演示，实际应用应用更安全的加密）
  const hashPassword = (pwd) => {
    let hash = 0
    for (let i = 0; i < pwd.length; i++) {
      const char = pwd.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // 登录：查询用户并验证密码
        const { data: profiles, error: queryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)

        if (queryError || !profiles || profiles.length === 0) {
          setError('用户名或密码错误')
          return
        }

        const profile = profiles[0]

        // 验证密码
        const hashedPassword = hashPassword(password)
        if (profile.password_hash !== hashedPassword) {
          setError('用户名或密码错误')
          return
        }

        localStorage.setItem('user', JSON.stringify({
          id: profile.id,
          username: profile.username
        }))

        onAuthSuccess(profile.id, profile.username)
      } else {
        // 注册：创建新用户
        if (!username || !password) {
          setError('请输入用户名和密码')
          return
        }

        if (username.length < 3) {
          setError('用户名至少需要 3 个字符')
          return
        }

        if (password.length < 6) {
          setError('密码至少需要 6 个字符')
          return
        }

        // 检查用户名是否已被使用
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)

        if (checkError) {
          setError('检查用户名失败，请重试')
          return
        }

        if (existingUsers && existingUsers.length > 0) {
          setError('用户名已被使用，请选择其他用户名')
          return
        }

        // 创建新用户
        const hashedPassword = hashPassword(password)
        const { data: newUser, error: insertError } = await supabase
          .from('profiles')
          .insert({
            username,
            password_hash: hashedPassword,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) {
          setError('注册失败，请重试')
          return
        }

        localStorage.setItem('user', JSON.stringify({
          id: newUser.id,
          username: newUser.username
        }))

        onAuthSuccess(newUser.id, newUser.username)
      }
    } catch (err) {
      setError('发生错误：' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Fitness</h1>
        <p className="auth-subtitle">减肥让生活更美好</p>

        <form onSubmit={handleAuth}>
          <div className="auth-tabs">
            <button
              type="button"
              className={`tab-btn ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true)
                setError('')
              }}
            >
              登录
            </button>
            <button
              type="button"
              className={`tab-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false)
                setError('')
              }}
            >
              注册
            </button>
          </div>

          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>

        <p className="auth-tips">
          {isLogin ? '首次使用？点击注册创建新账户' : '已有账户？切换到登录'}
        </p>
      </div>
    </div>
  )
}

export default Auth
