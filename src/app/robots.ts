export const dynamic = 'force-dynamic'

import config from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import { SITE_URL } from '@/lib/util'

// ИИ-поисковики: читают страницу в момент вопроса пользователя и ставят ссылку на сайт
const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'YandexAdditional', 'YandexAdditionalBot']
// Сборщики данных для обучения моделей
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'Bytespider', 'cohere-ai']

const CLOSED = ['/admin/', '/api/', '/ajax/', '/*?s=', '/*?cat=', '/*?paged=']

type Rule = { userAgent: string | string[]; allow?: string | string[]; disallow?: string | string[] }

/** «Дополнительные правила» из админки: строки User-agent / Allow / Disallow */
function parseExtra(text?: string): Rule[] {
  const rules: Rule[] = []
  let cur: { ua: string[]; allow: string[]; disallow: string[] } | null = null
  const flush = () => {
    if (cur && cur.ua.length) rules.push({ userAgent: cur.ua, allow: cur.allow.length ? cur.allow : undefined, disallow: cur.disallow.length ? cur.disallow : undefined })
  }
  for (const raw of String(text || '').split(/\r?\n/)) {
    const m = raw.replace(/#.*/, '').match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*$/i)
    if (!m) continue
    const [, key, val] = m
    const k = key.toLowerCase()
    if (k === 'user-agent') {
      if (cur && (cur.allow.length || cur.disallow.length)) {
        flush()
        cur = null
      }
      cur = cur || { ua: [], allow: [], disallow: [] }
      cur.ua.push(val)
    } else if (cur && k === 'allow') cur.allow.push(val)
    else if (cur && k === 'disallow') cur.disallow.push(val)
  }
  flush()
  return rules
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  // На тестовом домене (не getgeobit.ru) запрещаем индексацию целиком
  const isProd = /(^|\.)getgeobit\.ru$/.test(new URL(SITE_URL).hostname)
  if (!isProd) return { rules: [{ userAgent: '*', disallow: '/' }] }
  let s: any = {}
  try {
    const p = await getPayload({ config })
    s = await p.findGlobal({ slug: 'seo-settings', depth: 0 })
  } catch {}
  const block = (ua: string[], allow: boolean): Rule => (allow ? { userAgent: ua, allow: '/', disallow: CLOSED } : { userAgent: ua, disallow: '/' })
  return {
    rules: [block(['*'], true), block(AI_SEARCH, s?.aiSearch !== false), block(AI_TRAINING, s?.aiTraining !== false), ...parseExtra(s?.robotsExtra)],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
