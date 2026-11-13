import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { LEGAL_EDITION, PD_CONSENT, PD_EMAIL, PRIVACY_POLICY } from '../content/legal-2026-11'
import { toLexical } from '../lib/md-lexical'

/**
 * 152-ФЗ: новая редакция Политики и Согласия на обработку ПД (13.11.2026),
 * рабочий адрес для обращений вместо несуществующего info@getgeobit.ru и адреса входа в админку,
 * исправление ссылок «/» вместо адреса сайта в документах, редакция согласия для журнала заявок.
 */
export async function up({ payload, req, db }: MigrateUpArgs): Promise<void> {
  const docs: [string, string, string][] = [
    ['privacy-policy', 'Политика обработки персональных данных', PRIVACY_POLICY],
    ['soglasie-pd', 'Согласие на обработку персональных данных', PD_CONSENT],
  ]
  for (const [slug, title, body] of docs) {
    const r = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, req })
    const doc: any = r.docs[0]
    if (!doc) continue
    if (JSON.stringify(doc.content || '').includes(`Редакция от 13 ноября 2026`)) continue
    await payload.update({ collection: 'pages', id: doc.id, req, data: { title, content: toLexical(body) } as any })
  }

  // остальные документы: адрес сайта вместо «/» и рабочая почта
  await db.execute(sql`
    UPDATE "pages" SET "content" = replace(replace(replace(replace("content"::text,
      '"url": "/", ', '"url": "https://getgeobit.ru/", '),
      '"text": "/", ', '"text": "https://getgeobit.ru", '),
      'info@getgeobit.ru', ${PD_EMAIL}),
      'shocergod@gmail.com', ${PD_EMAIL})::jsonb
    WHERE "slug" IN ('oferta', 'soglasie-rassylka')
  `)

  await db.execute(sql`UPDATE "settings" SET "consent_doc_label" = ${`Редакция от ${LEGAL_EDITION} — /soglasie-pd/`}`)
}

export async function down({}: MigrateDownArgs): Promise<void> {}
