'use client'

import { useAuth } from '@payloadcms/ui'

/** Аватар в шапке админки: фото из профиля пользователя или инициал. */
export function Avatar() {
  const { user } = useAuth<any>()
  const av = user?.avatar
  const file = av && typeof av === 'object' ? av.sizes?.thumb?.filename || av.filename : null
  const letter = String(user?.name || user?.email || '?').slice(0, 1).toUpperCase()
  const base: React.CSSProperties = { width: 28, height: 28, borderRadius: '50%', display: 'block', objectFit: 'cover' }
  if (file) return <img src={`/media/${encodeURIComponent(file)}`} alt="" style={base} />
  return (
    <span style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#7b2fff,#ff3399)', color: '#fff', fontWeight: 700, fontSize: 13 }}>
      {letter}
    </span>
  )
}
