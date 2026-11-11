'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import { useState } from 'react'

/** Панель быстрых действий в карточке заявки */
export function LeadContact() {
  const phone = useFormFields(([f]) => f.phone?.value as string | undefined)
  const email = useFormFields(([f]) => f.email?.value as string | undefined)
  const method = useFormFields(([f]) => f.method?.value as string | undefined)
  const { value: status, setValue: setStatus } = useField<string>({ path: 'status' })
  const [copied, setCopied] = useState(false)
  const digits = (phone || '').replace(/\D/g, '').replace(/^8(?=\d{10}$)/, '7')
  const intl = digits.length === 10 ? '7' + digits : digits
  const methodLabel = { telegram: 'Telegram', max: 'MAX', call: 'звонок' }[method || ''] || 'не указан'

  return (
    <div className="gb-lead-actions">
      <div className="gb-lead-actions__hint">
        Клиент просил связаться: <b>{methodLabel}</b>
      </div>
      <div className="gb-lead-actions__row">
        {intl && (
          <>
            <a className="gb-btn" href={`tel:+${intl}`}>📞 Позвонить</a>
            <a className="gb-btn" href={`https://t.me/+${intl}`} target="_blank" rel="noopener">✈️ Telegram</a>
            <button
              type="button"
              className="gb-btn"
              onClick={() => {
                navigator.clipboard?.writeText('+' + intl)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? '✓ Скопировано' : '⧉ Копировать номер'}
            </button>
          </>
        )}
        {email && (
          <a className="gb-btn" href={`mailto:${email}`}>✉️ Написать на почту</a>
        )}
      </div>
      {status === 'new' && (
        <button type="button" className="gb-btn gb-btn--accent" onClick={() => setStatus('progress')}>
          Взять в работу (затем «Сохранить»)
        </button>
      )}
    </div>
  )
}
