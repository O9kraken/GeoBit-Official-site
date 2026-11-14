import type { Payload } from 'payload'
import { getAuthors } from './data'

/** Автор статьи по имени из профиля, а не по почте */
export async function AuthorCell({ cellData, rowData, payload }: { cellData?: any; rowData?: any; payload: Payload }) {
  const id = cellData && typeof cellData === 'object' ? cellData.id : cellData
  const user = id ? (await getAuthors(payload)).get(String(id)) : undefined
  // если в профиле нет имени, показываем «Имя автора вручную», а почту — только в крайнем случае
  const name = user && !user.includes('@') ? user : rowData?.authorName || user
  return <span className="gb-author">{name || '—'}</span>
}
