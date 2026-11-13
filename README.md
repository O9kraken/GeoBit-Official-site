<p align="center">
  <a href="https://getgeobit.ru"><img src=".github/assets/banner.png" alt="GeoBit | Official site" width="100%"></a>
</p>

<p align="center">
  <a href="https://getgeobit.ru"><img alt="Сайт" src="https://img.shields.io/badge/getgeobit.ru-online-7c00ff?style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
  <img alt="Payload CMS" src="https://img.shields.io/badge/Payload_CMS-3-0f0f0f?style=for-the-badge&logo=payloadcms&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-Caddy-2496ed?style=for-the-badge&logo=docker&logoColor=white">
</p>

<p align="center">
  <b>Сайт веб-студии GeoBit</b> — разработка сайтов, дизайн и SEO для бизнеса в Севастополе, Крыму и по всей России.<br>
  Лендинги от 29 900 ₽ · корпоративные сайты от 79 900 ₽ · интернет-магазины от 129 900 ₽
</p>

<p align="center">
  <a href="https://getgeobit.ru"><b>Открыть сайт</b></a> ·
  <a href="https://getgeobit.ru/portfolio/">Портфолио</a> ·
  <a href="https://getgeobit.ru/services/">Услуги</a> ·
  <a href="https://getgeobit.ru/blog/">Блог</a> ·
  <a href="https://getgeobit.ru/contacts/">Связаться</a>
</p>

---

<img src=".github/assets/showcase.png" alt="Главная страница getgeobit.ru на компьютере и телефоне" width="100%">

## О проекте

Это исходный код официального сайта студии GeoBit. Сайт сделан с нуля: свой дизайн в тёмной теме, админка для всего контента, продуманное SEO и защита персональных данных по 152-ФЗ. Работает на собственном сервере в России.

Сайт — одновременно и витрина студии, и пример того, как мы делаем проекты для клиентов.

## Что внутри

| | |
|---|---|
| 🎨 **Дизайн с нуля** | Тёмная тема, фирменная палитра, шрифт Unbounded, анимации, отдельно проработанные телефоны и планшеты |
| 🧩 **Удобная админка** | Payload CMS на русском: услуги и цены, кейсы, статьи, страницы, калькулятор, меню, заявки — всё правится без программиста |
| 📈 **SEO под Яндекс** | Мета-теги и микроразметка (Organization, Service, FAQ, BreadcrumbList, BlogPosting), карта сайта, IndexNow, SEO-аудит прямо в админке |
| 🤖 **Готовность к ИИ-поиску** | Короткие ответы для Алисы и ИИ-ассистентов, `llms.txt`, настройка доступа ИИ-ботов в `robots.txt` |
| 🗺️ **Города и отрасли** | Посадочные страницы для Симферополя, Ялты, Евпатории, Феодосии, Керчи и для отраслей: гостиницы, кафе, экскурсии, автосервисы |
| 🖼️ **Картинки для соцсетей** | Фирменная карточка для каждой страницы генерируется автоматически (`/og/`) |
| 🗓️ **Публикация по расписанию** | Статьи блога выходят сами в заданное время |
| 📬 **Заявки** | Формы с защитой от спама, письмо на почту, уведомление в Telegram и MAX, подтверждение клиенту, цели в Яндекс Метрике |
| 🔒 **Безопасность** | Лимиты попыток входа и форм, CSRF-защита, заголовки безопасности, загруженные файлы не исполняют скрипты |
| ⚖️ **152-ФЗ** | Согласие отдельным документом, баннер cookie с выбором категорий, данные только на серверах в России, журнал согласий, автоудаление старых заявок |

## Скриншоты

<table>
  <tr>
    <td width="50%"><img src=".github/assets/service.png" alt="Страница услуги"><p align="center"><sub>Страница услуги с интерактивным макетом</sub></p></td>
    <td width="50%"><img src=".github/assets/landing.png" alt="Отраслевая страница"><p align="center"><sub>Посадочная страница «Сайт для гостиницы»</sub></p></td>
  </tr>
  <tr>
    <td width="50%"><img src=".github/assets/admin-edit.png" alt="Админка"><p align="center"><sub>Админка: всё на русском, с подсказками</sub></p></td>
    <td width="50%">
      <p align="center">
        <img src=".github/assets/mobile-home.png" alt="Главная на телефоне" width="31%">
        <img src=".github/assets/mobile-post.png" alt="Статья на телефоне" width="31%">
        <img src=".github/assets/mobile-contacts.png" alt="Контакты на телефоне" width="31%">
      </p>
      <p align="center"><sub>Мобильная версия</sub></p>
    </td>
  </tr>
</table>

## Как устроено

```mermaid
flowchart LR
  U["Посетитель"] -->|HTTPS| C["Caddy<br/>сертификаты, сжатие, кэш"]
  C --> A["Next.js 16<br/>страницы сайта"]
  A --- P["Payload CMS 3<br/>админка /admin и API"]
  P --> D[("PostgreSQL 18<br/>контент и заявки")]
  P --> M["Файлы<br/>картинки и обложки"]
  A -->|заявка| N["Уведомления<br/>почта · Telegram · MAX"]
  G["GitHub Actions"] -->|образ ghcr.io| S["VPS в Москве<br/>Docker Compose"]
  S -.- C
```

- **Фронтенд и бэкенд в одном приложении.** Next.js рендерит страницы на сервере, Payload работает внутри него же: одна сборка, один контейнер.
- **Контент только в базе.** Тексты, цены и картинки меняются в админке и сразу появляются на сайте, без пересборки.
- **Деплой по пушу.** Пуш в `main` → GitHub Actions собирает Docker-образ → сервер скачивает его и перезапускается. Миграции базы применяются сами при старте.

## Стек

| Слой | Технологии |
|---|---|
| Приложение | Next.js 16 (App Router, standalone), React 19, TypeScript |
| CMS | Payload CMS 3: коллекции, глобалы, версии и черновики, очередь задач, Lexical-редактор |
| База | PostgreSQL 18, миграции Payload |
| Картинки | sharp (webp, нарезка размеров), `next/og` для карточек соцсетей |
| Почта | Nodemailer, свои шаблоны писем со светлой и тёмной темой |
| Сервер | Ubuntu 24.04, Docker Compose, Caddy (HTTPS от Let's Encrypt), резервные копии базы по расписанию |
| CI/CD | GitHub Actions → GitHub Container Registry → VPS |

## Структура

```
src/
├── app/(frontend)/     страницы сайта: главная, услуги, кейсы, блог, города и отрасли
├── app/(payload)/      админка Payload
├── app/ajax/           приём форм (заявки, подписка)
├── app/og/             генерация картинок для соцсетей
├── collections/        что редактируется в админке: услуги, кейсы, статьи, заявки…
├── globals/            страницы-одиночки и настройки сайта
├── components/         шапка, подвал, секции страниц, панели админки
├── content/            тексты, которые заливаются миграциями (статьи, документы)
├── lib/                SEO, уведомления, шаблоны писем, ограничение частоты
└── migrations/         миграции базы и контента
public/legacy/          стили, скрипты и шрифты сайта (без внешних CDN)
```

## Запуск у себя

Нужны Node.js 22+ и PostgreSQL 16+.

```bash
cp .env.example .env      # заполнить DATABASE_URI и PAYLOAD_SECRET
npm ci
npm run dev               # http://localhost:3000, админка — /admin/
```

Если поменялись поля в `src/collections/` или `src/globals/`, создайте миграцию и закоммитьте её:

```bash
npm run migrate:create имя-изменения
```

Как устроены сервер и деплой — в [docs/DEPLOY.md](docs/DEPLOY.md).

## Автор

**Георгий Каляков** — основатель GeoBit, дизайнер и разработчик. 5 лет делаю сайты для бизнеса.

<p>
  <a href="https://getgeobit.ru"><img alt="getgeobit.ru" src="https://img.shields.io/badge/getgeobit.ru-7c00ff?style=flat-square&logo=googlechrome&logoColor=white"></a>
  <a href="https://t.me/krakeno9"><img alt="Telegram" src="https://img.shields.io/badge/Telegram-@krakeno9-26a5e4?style=flat-square&logo=telegram&logoColor=white"></a>
  <a href="https://vk.com/kraken_o9"><img alt="VK" src="https://img.shields.io/badge/VK-kraken__o9-0077ff?style=flat-square&logo=vk&logoColor=white"></a>
</p>

Нужен сайт? [Оставьте заявку на getgeobit.ru](https://getgeobit.ru/contacts/) — обсудим задачу и назовём срок и цену.

## Лицензия

Код открыт для просмотра, но не для использования: © GeoBit, все права защищены. Подробнее — в [LICENSE](LICENSE).
