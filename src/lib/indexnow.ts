import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import { SITE_URL, paths } from './util'

const PATHS: Record<string, (slug: string) => string> = {
  posts: paths.post,
  pages: paths.page,
  services: paths.service,
  landings: paths.landing,
  projects: paths.project,
}

/** Отправляет адреса в IndexNow (Яндекс, Bing и др. делятся между собой). Только на основном домене. */
export async function pingIndexNow(payload: any, urls: string[]) {
  try {
    const host = new URL(SITE_URL).hostname
    if (!/(^|\.)getgeobit\.ru$/.test(host) || !urls.length) return
    const s: any = await payload.findGlobal({ slug: 'seo-settings', depth: 0, overrideAccess: true })
    if (s?.indexNow === false || !s?.indexNowKey) return
    const body = { host, key: s.indexNowKey, keyLocation: `${SITE_URL}/indexnow.txt`, urlList: urls }
    const r = await fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    })
    payload.logger.info(`IndexNow: ${r.status} ${urls.join(', ')}`)
  } catch (e) {
    payload.logger?.warn?.(`IndexNow: ${String(e)}`)
  }
}

const hook: CollectionAfterChangeHook = ({ doc, collection, req }) => {
  const toPath = PATHS[collection.slug]
  if (!toPath || !doc?.slug) return doc
  if (doc._status && doc._status !== 'published') return doc
  if (doc.meta?.noindex || doc.noindex) return doc
  // не ждём ответа — сохранение в админке не тормозит
  void pingIndexNow(req.payload, [`${SITE_URL}${toPath(doc.slug)}`])
  return doc
}

export const withIndexNow = (c: CollectionConfig): CollectionConfig =>
  PATHS[c.slug] ? { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange || []), hook] } } : c
