import type { Field } from 'payload'

/**
 * Поля вкладки «SEO и ИИ»: используются и в коллекциях (группа meta от плагина SEO),
 * и в страницах-глобалах (группа seo). Имена title / description / image прежние —
 * данные в базе сохраняются.
 */
export const seoInnerFields = ({ withFaq = false }: { withFaq?: boolean } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      {
        name: 'focusKeyword',
        label: 'Ключевая фраза',
        type: 'text',
        index: true,
        admin: { width: '55%', placeholder: 'например: создание сайта в Севастополе', description: 'Главный запрос, по которому страницу должны находить. Одна фраза на страницу.' },
      },
      {
        name: 'synonyms',
        label: 'Синонимы',
        type: 'text',
        admin: { width: '45%', placeholder: 'разработка сайтов, сайт под ключ', description: 'Через запятую — тоже засчитываются.' },
      },
    ],
  },
  { name: 'title', label: 'Title — заголовок в поиске', type: 'text', admin: { placeholder: 'Если пусто — возьмётся заголовок страницы + «— GeoBit»' } },
  { name: 'description', label: 'Description — описание в поиске', type: 'textarea', admin: { rows: 3, placeholder: 'Если пусто — поисковик сам выберет кусок текста' } },
  { name: 'image', label: 'Картинка для соцсетей и мессенджеров', type: 'upload', relationTo: 'media', admin: { description: '1200×630. Если пусто — возьмётся обложка или картинка по умолчанию.' } },
  { name: 'panel', type: 'ui', admin: { components: { Field: '/components/admin/SeoPanel#SeoPanel' } } },
  {
    type: 'collapsible',
    label: 'ИИ-поиск: короткий ответ и вопросы',
    admin: { initCollapsed: false, description: 'Для «быстрых ответов» Яндекса и Google, Алисы, ChatGPT, Perplexity.' },
    fields: [
      {
        name: 'answer',
        label: 'Короткий ответ',
        type: 'textarea',
        admin: {
          rows: 3,
          description:
            '2–3 предложения (30–60 слов), которые прямо отвечают на главный вопрос страницы. Показывается вверху статьи блоком «Коротко», попадает в разметку и в llms.txt.',
        },
      },
      ...(withFaq
        ? [
            {
              name: 'faq',
              label: 'Вопросы и ответы',
              type: 'array',
              labels: { singular: 'Вопрос', plural: 'Вопросы' },
              admin: { description: 'Пишите вопросы так, как их задают люди. Выводятся в конце страницы и размечаются FAQPage.' },
              fields: [
                { name: 'q', label: 'Вопрос', type: 'text', required: true },
                { name: 'a', label: 'Ответ', type: 'textarea', required: true },
              ],
            } as Field,
          ]
        : []),
    ],
  },
  {
    type: 'collapsible',
    label: 'Дополнительно',
    admin: { initCollapsed: true },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'noindex', label: 'Не индексировать (скрыть из поиска)', type: 'checkbox', admin: { width: '50%' } },
          { name: 'nofollow', label: 'Не переходить по ссылкам (nofollow)', type: 'checkbox', admin: { width: '50%' } },
        ],
      },
      {
        name: 'canonical',
        label: 'Канонический адрес',
        type: 'text',
        admin: { placeholder: 'https://getgeobit.ru/...', description: 'Только если эта страница — копия другой. Обычно оставляйте пустым.' },
      },
    ],
  },
]
