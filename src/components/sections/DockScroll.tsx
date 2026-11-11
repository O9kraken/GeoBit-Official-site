'use client'

import { useEffect } from 'react'

/** Подсвечивает текущий раздел; для главной переключает «островок» по прокрутке. */
export default function DockScroll({ variant }: { variant: 'hero' | 'top' }) {
  useEffect(() => {
    const dock = document.querySelector<HTMLElement>(`.gb-dock--${variant}`)
    if (!dock) return
    const path = window.location.pathname
    dock.querySelectorAll<HTMLAnchorElement>('.gb-dock__link').forEach((a) => {
      const href = a.getAttribute('href') || ''
      const on = href === '/' ? path === '/' : path.startsWith(href)
      a.classList.toggle('is-active', on)
    })
    if (variant !== 'hero') return
    let raf = 0
    const update = () => {
      raf = 0
      const stuck = dock.getBoundingClientRect().top <= 15 && window.scrollY > 40
      dock.classList.toggle('is-island', stuck)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [variant])
  return null
}
