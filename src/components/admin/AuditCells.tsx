'use client'

const URL_OF = (target?: string, id?: string) => {
  if (!target || !id) return undefined
  const globals = ['home', 'services-page', 'about-page', 'contacts-page', 'portfolio-page', 'blog-page', 'faq-page', 'settings', 'seo-settings', 'navigation', 'calculator']
  return globals.includes(target) ? `/admin/globals/${target}` : `/admin/collections/${target}/${id}`
}

/** Запись в истории — ссылкой на сам документ (если он ещё существует) */
export function DocCell({ cellData, rowData }: { cellData?: string; rowData?: any }) {
  const href = rowData?.action !== 'delete' ? URL_OF(rowData?.target, rowData?.docId) : undefined
  return href ? (
    <a href={href} onClick={(e) => e.stopPropagation()} style={{ fontWeight: 600 }}>
      {cellData || rowData?.docId}
    </a>
  ) : (
    <span>{cellData || rowData?.docId}</span>
  )
}
