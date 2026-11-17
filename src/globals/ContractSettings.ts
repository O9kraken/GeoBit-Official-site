import type { GlobalConfig } from 'payload'

/** Реквизиты исполнителя для договоров (самозанятый) и условия по умолчанию */
export const ContractSettings: GlobalConfig = {
  slug: 'contract-settings',
  label: 'Реквизиты для договоров',
  admin: { group: 'Продажи', description: 'Эти данные подставляются в каждый договор: шапка, раздел «Реквизиты и подписи», условия по умолчанию.' },
  access: { read: ({ req }) => Boolean(req.user) },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Исполнитель',
          fields: [
            { type: 'row', fields: [
              { name: 'fio', label: 'ФИО полностью', type: 'text', admin: { description: 'Как в паспорте: Фамилия Имя Отчество' } },
              { name: 'inn', label: 'ИНН', type: 'text' },
            ] },
            { name: 'address', label: 'Адрес регистрации', type: 'text' },
            { type: 'row', fields: [
              { name: 'phone', label: 'Телефон', type: 'text' },
              { name: 'email', label: 'Эл. почта', type: 'email' },
              { name: 'site', label: 'Сайт', type: 'text', defaultValue: 'getgeobit.ru' },
            ] },
            { type: 'row', fields: [
              { name: 'bankAccount', label: 'Р/с', type: 'text' },
              { name: 'bankName', label: 'Банк', type: 'text' },
              { name: 'bik', label: 'БИК', type: 'text' },
              { name: 'corrAccount', label: 'К/с', type: 'text' },
            ] },
            { name: 'city', label: 'Город заключения договора', type: 'text', defaultValue: 'Севастополь' },
          ],
        },
        {
          label: 'Условия по умолчанию',
          fields: [
            { type: 'row', fields: [
              { name: 'revisions', label: 'Кругов правок', type: 'number', defaultValue: 2 },
              { name: 'warrantyDays', label: 'Гарантия, календарных дней', type: 'number', defaultValue: 30 },
              { name: 'acceptDays', label: 'Срок приёмки, рабочих дней', type: 'number', defaultValue: 5 },
            ] },
            { type: 'row', fields: [
              { name: 'penalty', label: 'Неустойка, % в день', type: 'number', defaultValue: 0.1 },
              { name: 'penaltyCap', label: 'Потолок неустойки, %', type: 'number', defaultValue: 10 },
            ] },
          ],
        },
      ],
    },
  ],
}
