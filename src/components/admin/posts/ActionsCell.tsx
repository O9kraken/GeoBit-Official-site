'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Act = 'publish' | 'unpublish' | 'duplicate'

const ASK: Record<Act, string> = {
  publish: 'Опубликовать статью сейчас? Если она стояла в расписании, расписание снимется.',
  unpublish: 'Снять статью с сайта? Она останется в черновиках.',
  duplicate: 'Сделать копию статьи? Копия появится в черновиках.',
}

/** Быстрые действия в строке списка статей */
export function ActionsCell({ rowData }: { rowData?: any }) {
  const router = useRouter()
  const [busy, setBusy] = useState<Act | null>(null)
  if (!rowData?.id) return null
  const live = rowData._status === 'published'
  const edit = `/admin/collections/posts/${rowData.id}`

  const run = async (act: Act) => {
    if (!window.confirm(ASK[act])) return
    setBusy(act)
    try {
      const r = await fetch(`/api/posts/${rowData.id}/quick?action=${act}`, { method: 'POST', credentials: 'include' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j?.error || `Ошибка ${r.status}`)
      if (act === 'duplicate' && j?.id) router.push(`/admin/collections/posts/${j.id}`)
      else router.refresh()
    } catch (e: any) {
      window.alert(`Не получилось: ${e?.message || e}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="gb-act" onClick={(e) => e.stopPropagation()}>
      <a className="gb-act__b" href={edit} title="Открыть редактор">
        Изменить
      </a>
      {live ? (
        <>
          <a className="gb-act__b" href={`/${rowData.slug}/`} target="_blank" rel="noopener" title="Открыть статью на сайте">
            На сайте ↗
          </a>
          <button type="button" className="gb-act__b gb-act__b--muted" disabled={!!busy} onClick={() => run('unpublish')} title="Убрать с сайта в черновики">
            {busy === 'unpublish' ? '…' : 'Снять'}
          </button>
        </>
      ) : (
        <button type="button" className="gb-act__b gb-act__b--go" disabled={!!busy} onClick={() => run('publish')} title="Опубликовать прямо сейчас">
          {busy === 'publish' ? 'Публикую…' : 'Опубликовать'}
        </button>
      )}
      <button type="button" className="gb-act__b gb-act__b--icon" disabled={!!busy} onClick={() => run('duplicate')} title="Сделать копию">
        {busy === 'duplicate' ? '…' : '⧉'}
      </button>
    </div>
  )
}
