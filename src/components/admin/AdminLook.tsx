'use client'
import { useAuth } from '@payloadcms/ui'
import { useEffect, type ReactNode } from 'react'

/**
 * Личное оформление админки: настройки берутся из профиля пользователя
 * («Аккаунт → Оформление админки») и вешаются атрибутами на <html>, а стили — в custom.css.
 * Последний выбор кэшируется в localStorage, чтобы при загрузке не мигало оформление по умолчанию.
 */
const KEY = 'gb-admin-look'

function apply(look: Record<string, string>) {
  const d = document.documentElement
  d.dataset.gbAccent = look.accent || 'geobit'
  d.dataset.gbDensity = look.density || 'normal'
  d.dataset.gbFont = look.font || 'm'
  d.dataset.gbIcons = look.icons === 'off' ? 'off' : 'on'
}

export function AdminLook({ children }: { children?: ReactNode }) {
  const { user } = useAuth<any>()

  useEffect(() => {
    try {
      const cached = localStorage.getItem(KEY)
      if (cached) apply(JSON.parse(cached))
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) return
    const look = {
      accent: user.uiAccent || 'geobit',
      density: user.uiDensity || 'normal',
      font: user.uiFontSize || 'm',
      icons: user.uiIcons === false ? 'off' : 'on',
    }
    apply(look)
    try {
      localStorage.setItem(KEY, JSON.stringify(look))
    } catch {}
  }, [user])

  return <>{children}</>
}
