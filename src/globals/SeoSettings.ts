import type { GlobalConfig } from 'payload'
import { authenticated } from '../access'

const randomKey = () => Array.from({ length: 32 }, () => 'abcdef0123456789'[Math.floor(Math.random() * 16)]).join('')

export const SeoSettings: GlobalConfig = {
  slug: 'seo-settings',
  label: 'SEO и ИИ-поиск',
  admin: { group: 'Настройки', description: 'Общие правила для всего сайта. Настройки отдельной страницы — во вкладке «SEO и ИИ» у самой страницы.' },
  access: { read: authenticated, update: authenticated },
  hooks: {
    beforeChange: [({ data }) => ({ ...data, indexNowKey: data?.indexNowKey || randomKey() })],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Общие',
          fields: [
            {
              name: 'titleTemplate',
              label: 'Шаблон title',
              type: 'text',
              defaultValue: '%s — GeoBit',
              admin: { description: '%s заменяется заголовком страницы. Работает, когда у страницы не заполнен свой title.' },
            },
            { name: 'defaultImage', label: 'Картинка для соцсетей по умолчанию', type: 'upload', relationTo: 'media', admin: { description: '1200×630, для страниц без своей картинки.' } },
          ],
        },
        {
          label: 'ИИ-поиск',
          description: 'GEO и AEO — чтобы ChatGPT, Perplexity, Claude, Алиса и «быстрые ответы» поисковиков находили и цитировали сайт.',
          fields: [
            {
              name: 'aiSearch',
              label: 'Пускать ИИ-поисковики',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'ChatGPT Search, Perplexity, Claude, Яндекс Нейро — они читают страницу, когда пользователь задаёт вопрос, и дают ссылку на сайт. Рекомендуется включить.',
              },
            },
            {
              name: 'aiTraining',
              label: 'Разрешить обучение ИИ-моделей на текстах сайта',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'GPTBot, ClaudeBot, Google-Extended и др. Если разрешить, модели «запомнят» студию и чаще будут упоминать её без поиска. Если запретить — тексты не попадут в обучение.',
              },
            },
            { name: 'llmsEnabled', label: 'Публиковать llms.txt', type: 'checkbox', defaultValue: true, admin: { description: 'Короткая «визитка» сайта для ИИ по адресу /llms.txt: кто вы, услуги с ценами, статьи, ответы на вопросы. Собирается автоматически.' } },
            {
              name: 'llmsIntro',
              label: 'Описание студии для ИИ',
              type: 'textarea',
              admin: {
                rows: 4,
                description: '2–4 предложения фактами: кто, где, что делаете, для кого, цены от. Это первое, что прочитает ИИ о компании.',
                placeholder: 'GeoBit — веб-студия из Севастополя. Делаем лендинги от 29 900 ₽, корпоративные сайты от 79 900 ₽ и интернет-магазины от 129 900 ₽ для малого бизнеса Крыма и всей России…',
              },
            },
          ],
        },
        {
          label: 'Индексация',
          fields: [
            {
              name: 'indexNow',
              label: 'Сообщать Яндексу и Bing о новых страницах (IndexNow)',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'После публикации или изменения страница сразу отправляется на переобход — не нужно ждать неделями. Работает только на основном домене.' },
            },
            { name: 'indexNowKey', label: 'Ключ IndexNow', type: 'text', admin: { readOnly: true, description: 'Создаётся сам при первом сохранении.' } },
            {
              name: 'robotsExtra',
              label: 'Дополнительные правила robots.txt',
              type: 'code',
              admin: { language: 'plaintext', description: 'Для опытных: строки добавятся в конец robots.txt как есть.' },
            },
          ],
        },
      ],
    },
  ],
}
