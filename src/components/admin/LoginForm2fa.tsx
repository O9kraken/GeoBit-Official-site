'use client'
import { useRef, useState } from 'react'

export function LoginForm2fa({ redirect }: { redirect: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'password' | 'code'>('password')
  const [recovery, setRecovery] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const r = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(step === 'code' ? { totp: code } : {}) }),
      })
      const j = await r.json().catch(() => ({}))
      const msg: string = j?.errors?.[0]?.message || j?.message || ''
      if (r.ok && j?.user) {
        window.location.assign(redirect)
        return
      }
      if (msg === 'TOTP_REQUIRED') {
        setStep('code')
        setTimeout(() => codeRef.current?.focus(), 50)
        return
      }
      setErr(r.status === 401 && step === 'password' ? 'Неверная почта или пароль' : msg || `Не получилось войти (${r.status})`)
      if (step === 'code') setCode('')
    } catch {
      setErr('Нет связи с сервером')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="gb-login__form" onSubmit={submit}>
      {step === 'password' ? (
        <>
          <label>
            <span>Электронная почта</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </label>
          <label>
            <span>Пароль</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <a className="gb-login__link" href="/admin/forgot">
            Забыли пароль?
          </a>
        </>
      ) : (
        <>
          <p className="gb-login__hint">{recovery ? 'Введите один из резервных кодов (вида ABCDE-12345).' : 'Откройте приложение для кодов (Яндекс Ключ, Google Authenticator) и введите 6 цифр для GeoBit.'}</p>
          <label>
            <span>{recovery ? 'Резервный код' : 'Код из приложения'}</span>
            <input
              ref={codeRef}
              inputMode={recovery ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              maxLength={recovery ? 11 : 6}
              required
              value={code}
              onChange={(e) => setCode(recovery ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
              placeholder={recovery ? 'ABCDE-12345' : '123456'}
            />
          </label>
          <button type="button" className="gb-login__link" onClick={() => { setRecovery((v) => !v); setCode('') }}>
            {recovery ? 'Ввести код из приложения' : 'Нет телефона? Ввести резервный код'}
          </button>
        </>
      )}
      {err && <p className="gb-login__err">{err}</p>}
      <button type="submit" className="gb-login__btn" disabled={busy}>
        {busy ? 'Проверяю…' : step === 'password' ? 'Войти' : 'Подтвердить'}
      </button>
      {step === 'code' && (
        <button type="button" className="gb-login__link" onClick={() => { setStep('password'); setCode(''); setErr('') }}>
          ← Назад
        </button>
      )}
    </form>
  )
}
