'use client'

import { useEffect } from 'react'
import { av } from '@/lib/asset'

declare global {
  interface Window {
    __geobitQueue?: Promise<void>
    __geobitLoaded?: Set<string>
  }
}

function loadOne(src: string): Promise<void> {
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = av(src)
    s.async = false
    s.onload = () => resolve()
    s.onerror = () => {
      console.error('[geobit] не загрузился скрипт', src)
      resolve()
    }
    document.body.appendChild(s)
  })
}

/**
 * Запускает скрипты старой темы после гидратации React, строго по порядку.
 * Первым всегда идёт boot.js — прослойка для DOMContentLoaded/load.
 */
export default function LegacyScripts({ src }: { src: string[] }) {
  useEffect(() => {
    const loaded = (window.__geobitLoaded ||= new Set())
    const list = ['/legacy/js/boot.js', ...src].filter((u) => !loaded.has(u))
    list.forEach((u) => loaded.add(u))
    window.__geobitQueue = (window.__geobitQueue || Promise.resolve()).then(async () => {
      for (const u of list) await loadOne(u)
    })
  }, [src])
  return null
}
