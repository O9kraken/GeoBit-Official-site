/**
 * Блоки для ИИ-поиска (AEO): «Коротко» — прямой ответ на главный вопрос страницы,
 * и вопросы-ответы из вкладки «SEO и ИИ». Разметка FAQPage подключается на странице.
 */
export function AnswerBox({ text }: { text?: string | null }) {
  const t = (text || '').trim()
  if (!t) return null
  return (
    <aside className="gb-answer" aria-label="Коротко">
      <span className="gb-answer__label">
        <i className="fas fa-bolt" aria-hidden="true"></i> Коротко
      </span>
      <p>{t}</p>
    </aside>
  )
}

export function DocFaq({ faq, title = 'Вопросы и ответы' }: { faq?: { q: string; a: string }[] | null; title?: string }) {
  if (!faq?.length) return null
  faq = faq.slice(0, 7)
  return (
    <section className="gb-docfaq">
      <h2>{title}</h2>
      {faq.map((f, i) => (
        <details key={i} className="gb-docfaq__item" open={i === 0}>
          <summary>
            {f.q}
            <i className="fas fa-chevron-down" aria-hidden="true"></i>
          </summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  )
}
