import { seoInnerFields } from '../fields/seo'
import type { Field, GlobalConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { faqField } from '../fields/faq'
import { ctaAction } from '../fields/link'

const htmlNote = { description: 'Можно выделить часть градиентом: <span class="gradient-text">текст</span>' }
const seoGroup: Field = {
  name: 'seo',
  label: 'SEO и ИИ-поиск',
  type: 'group',
  fields: seoInnerFields(),
}
const headerGroup = (prefix = ''): Field[] => [
  { name: `${prefix}tag`, label: 'Метка над заголовком', type: 'text' },
  { name: `${prefix}title`, label: 'Заголовок (H1)', type: 'text', admin: htmlNote },
  { name: `${prefix}subtitle`, label: 'Подзаголовок', type: 'textarea' },
]
const iconTitleText = (name: string, label: string, extra: Field[] = []): Field => ({
  name,
  label,
  type: 'array',
  fields: [
    { type: 'row', fields: [
      { name: 'icon', label: 'Иконка FA', type: 'text' },
      { name: 'title', label: 'Заголовок', type: 'text', required: true },
    ] },
    { name: 'text', label: 'Текст', type: 'textarea' },
    ...extra,
  ],
})
const g = (slug: string, label: string, fields: Field[]): GlobalConfig => ({
  slug,
  label,
  admin: { group: 'Страницы' },
  access: { read: anyone, update: authenticated },
  fields,
})

export const HomePage = g('home', 'Главная', [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Первый экран',
        fields: [
          { name: 'heroBadge', label: 'Плашка', type: 'text' },
          { type: 'row', fields: [
            { name: 'heroTitle1', label: 'Заголовок, строка 1', type: 'text' },
            { name: 'heroTitle2', label: 'Заголовок, строка 2 (градиент)', type: 'text' },
          ] },
          { name: 'heroSubtitle', label: 'Подзаголовок', type: 'textarea' },
          { type: 'row', fields: [
            { name: 'heroCta1Text', label: 'Кнопка 1', type: 'text' },
            ...ctaAction('heroCta1Action', 'Кнопка 1: действие', 'calculator'),
          ] },
          { type: 'row', fields: [
            { name: 'heroCta2Text', label: 'Кнопка 2', type: 'text' },
            ...ctaAction('heroCta2Action', 'Кнопка 2: действие', 'custom'),
          ] },
          {
            name: 'heroStats',
            label: 'Цифры',
            type: 'array',
            maxRows: 3,
            fields: [{ type: 'row', fields: [
              { name: 'value', label: 'Число', type: 'number', required: true },
              { name: 'suffix', label: 'После числа', type: 'text', defaultValue: '+' },
              { name: 'label', label: 'Подпись', type: 'text', required: true },
            ] }],
          },
          {
            name: 'heroBadges',
            label: 'Плашки на иллюстрации',
            type: 'array',
            fields: [{ type: 'row', fields: [
              { name: 'icon', label: 'Иконка FA', type: 'text' },
              { name: 'text', label: 'Текст', type: 'text', required: true },
            ] }],
          },
        ],
      },
      {
        label: 'Услуги',
        fields: [
          { name: 'servicesTag', label: 'Метка', type: 'text' },
          { name: 'servicesTitle', label: 'Заголовок', type: 'text', admin: htmlNote },
          { name: 'servicesDesc', label: 'Описание', type: 'textarea' },
        ],
      },
      {
        label: 'О студии',
        fields: [
          { name: 'aboutTag', label: 'Метка', type: 'text' },
          { name: 'aboutTitle', label: 'Заголовок', type: 'text', admin: htmlNote },
          { name: 'aboutText1', label: 'Абзац 1', type: 'textarea' },
          { name: 'aboutText2', label: 'Абзац 2', type: 'textarea' },
          { type: 'row', fields: [
            { name: 'aboutYears', label: 'Лет на рынке', type: 'text' },
            { name: 'aboutProjects', label: 'Проектов', type: 'text' },
          ] },
          iconTitleText('aboutFeatures', 'Преимущества'),
        ],
      },
      {
        label: 'Процесс',
        fields: [
          { name: 'processTag', label: 'Метка', type: 'text' },
          { name: 'processTitle', label: 'Заголовок', type: 'text', admin: htmlNote },
          { name: 'processDesc', label: 'Описание', type: 'textarea' },
          {
            name: 'processSteps',
            label: 'Этапы',
            type: 'array',
            fields: [
              { type: 'row', fields: [
                { name: 'num', label: '№', type: 'text' },
                { name: 'icon', label: 'Иконка FA', type: 'text' },
                { name: 'title', label: 'Этап', type: 'text', required: true },
                { name: 'duration', label: 'Срок', type: 'text' },
              ] },
              { name: 'text', label: 'Описание', type: 'textarea' },
            ],
          },
        ],
      },
      {
        label: 'Преимущества',
        fields: [
          iconTitleText('advantages', 'Преимущества', [
            { type: 'row', fields: [
              { name: 'metricValue', label: '% прогресса', type: 'number' },
              { name: 'metricLabel', label: 'Подпись показателя', type: 'text' },
            ] },
          ]),
        ],
      },
      {
        label: 'FAQ и CTA',
        fields: [
          { name: 'faqTag', label: 'FAQ: метка', type: 'text' },
          { name: 'faqTitle', label: 'FAQ: заголовок', type: 'text', admin: htmlNote },
          faqField(),
          { name: 'seoBlockTitle', label: 'SEO-блок: заголовок', type: 'text' },
          { name: 'seoBlockText', label: 'SEO-блок: текст (HTML)', type: 'code', admin: { language: 'html' } },
          { name: 'ctaTag', label: 'CTA: метка', type: 'text' },
          { name: 'ctaTitle', label: 'CTA: заголовок', type: 'text', admin: htmlNote },
          { name: 'ctaDesc', label: 'CTA: описание', type: 'textarea' },
          { name: 'ctaButton', label: 'CTA: кнопка', type: 'text' },
        ],
      },
      { label: 'SEO и ИИ', fields: [seoGroup] },
    ],
  },
])

export const ServicesPage = g('services-page', 'Страница «Услуги»', [
  ...headerGroup(),
  { name: 'pricingTitle', label: 'Тарифы: заголовок', type: 'text' },
  { name: 'pricingSubtitle', label: 'Тарифы: подзаголовок', type: 'text' },
  {
    name: 'plans',
    label: 'Тарифы техподдержки',
    type: 'array',
    fields: [
      { type: 'row', fields: [
        { name: 'name', label: 'Название', type: 'text', required: true },
        { name: 'price', label: 'Цена', type: 'text' },
        { name: 'btnText', label: 'Кнопка', type: 'text' },
        { name: 'featured', label: 'Выделить', type: 'checkbox' },
      ] },
      { name: 'desc', label: 'Описание', type: 'text' },
      { name: 'features', label: 'Состав (с новой строки)', type: 'textarea' },
    ],
  },
  faqField(),
  seoGroup,
])

export const AboutPage = g('about-page', 'Страница «О нас»', [
  ...headerGroup(),
  { name: 'storyTitle', label: 'История: заголовок', type: 'text' },
  { name: 'storyText1', label: 'История: абзац 1', type: 'textarea' },
  { name: 'storyText2', label: 'История: абзац 2', type: 'textarea' },
  { name: 'storyImage', label: 'История: фото', type: 'upload', relationTo: 'media' },
  {
    name: 'stats',
    label: 'Цифры студии',
    type: 'array',
    fields: [{ type: 'row', fields: [
      { name: 'icon', label: 'Иконка FA', type: 'text' },
      { name: 'value', label: 'Значение', type: 'text', required: true },
      { name: 'label', label: 'Подпись', type: 'text' },
    ] }],
  },
  { name: 'missionText', label: 'Миссия: текст', type: 'textarea' },
  { name: 'missionAuthor', label: 'Миссия: подпись', type: 'text' },
  { name: 'whyTitle', label: 'Почему мы: заголовок', type: 'text', admin: htmlNote },
  iconTitleText('why', 'Почему мы'),
  iconTitleText('guarantees', 'Гарантии'),
  { name: 'valuesTitle', label: 'Ценности: заголовок', type: 'text', admin: htmlNote },
  iconTitleText('values', 'Ценности'),
  { name: 'techTitle', label: 'Технологии: заголовок', type: 'text', admin: htmlNote },
  {
    name: 'tech',
    label: 'Технологии',
    type: 'array',
    fields: [{ type: 'row', fields: [
      { name: 'icon', label: 'Иконка', type: 'text' },
      { name: 'label', label: 'Название', type: 'text', required: true },
      { name: 'level', label: 'Уровень, %', type: 'number' },
    ] }],
  },
  {
    name: 'timeline',
    label: 'История / таймлайн',
    type: 'array',
    fields: [
      { type: 'row', fields: [
        { name: 'year', label: 'Год', type: 'text' },
        { name: 'title', label: 'Событие', type: 'text', required: true },
      ] },
      { name: 'text', label: 'Описание', type: 'textarea' },
    ],
  },
  faqField(),
  seoGroup,
])

export const ContactsPage = g('contacts-page', 'Страница «Контакты»', [
  ...headerGroup(),
  { name: 'formTitle', label: 'Форма: заголовок', type: 'text' },
  { name: 'formSubtitle', label: 'Форма: подзаголовок', type: 'text' },
  { name: 'servicesList', label: 'Варианты «Интересующая услуга» (с новой строки)', type: 'textarea' },
  faqField(),
  seoGroup,
])

export const PortfolioPage = g('portfolio-page', 'Страница «Портфолио»', [...headerGroup(), faqField(), seoGroup])

export const BlogPage = g('blog-page', 'Страница «Блог»', [
  ...headerGroup(),
  { name: 'newsletterTitle', label: 'Подписка: заголовок', type: 'text' },
  { name: 'newsletterText', label: 'Подписка: текст', type: 'text' },
  seoGroup,
])

export const FaqPage = g('faq-page', 'Страница «FAQ»', [
  ...headerGroup(),
  faqField('faq', 'Общие вопросы (выводятся на главной, в кейсах и на странице FAQ)'),
  seoGroup,
])
