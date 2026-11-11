import config from '@payload-config'
import { getPayload } from 'payload'
import { SITE_URL } from '@/lib/util'

export const dynamic = 'force-dynamic'

// ИИ-поисковики: читают страницу в момент вопроса пользователя и ставят ссылку на сайт
const AI_SEARCH = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'YandexAdditional', 'YandexAdditionalBot']
// Сборщики данных для обучения моделей
const AI_TRAINING = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'Bytespider', 'cohere-ai']

const CLOSED = ['/admin/', '/api/', '/ajax/', '/*?s=', '/*?cat=', '/*?paged=']

export async function GET() {
  const host = new URL(SITE_URL).hostname
  const lines: string[] = []
  // На тестовом домене (не getgeobit.ru) индексация запрещена целиком
  if (!/(^|\.)getgeobit\.ru$/.test(host)) {
    lines.push('User-agent: *', 'Disallow: /')
    return text(lines)
  }
  const p = await getPayload({ config })
  const s: any = await p.findGlobal({ slug: 'seo-settings', depth: 0 }).catch(() => ({}))
  const block = (agents: string[], allow: boolean) => {
    agents.forEach((a) => lines.push(`User-agent: ${a}`))
    if (allow) {
      lines.push('Allow: /')
      CLOSED.forEach((d) => lines.push(`Disallow: ${d}`))
    } else lines.push('Disallow: /')
    lines.push('')
  }
  block(['*'], true)
  block(AI_SEARCH, s?.aiSearch !== false)
  block(AI_TRAINING, s?.aiTraining !== false)
  if (s?.robotsExtra) lines.push(String(s.robotsExtra).trim(), '')
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`, `Host: ${SITE_URL}`)
  return text(lines)
}

const text = (lines: string[]) => new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
