import { postAuthor } from '@/lib/payload'
import { formatDateRu, mediaUrl, paths } from '@/lib/util'

export function PfCard({ p }: { p: any }) {
  const cover = mediaUrl(p.cover, 'card') || mediaUrl(p.cover)
  const cat = p.categories?.[0]
  const catSlug = cat?.slug || 'other'
  const catName = cat?.name || p.categoryLabel || ''
  const tech = (p.technologies || '').split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 3)
  const metric = p.results?.[0]
  const hover = p.hoverVideo ? mediaUrl(p.hoverVideo) : ''
  const excerpt = (p.excerpt || '').split(/\s+/).slice(0, 16).join(' ')
  return (
    <article className="pf-card" data-category={catSlug}>
      <a href={paths.project(p.slug)} className="pf-card-link" aria-label={p.title}>
        <div className={'pf-card-media' + (hover ? ' has-anim' : '')}>
          {cover && <img src={cover} alt={p.cover?.alt || p.title} width={800} height={600} loading="lazy" decoding="async" />}
          {hover && <video className="pf-card-media__anim" muted loop playsInline preload="none" data-src={hover} aria-hidden="true"></video>}
          <div className="pf-card-media-grad"></div>
          {catName && <span className="pf-card-cat">{catName}</span>}
          {metric?.value && (
            <div className="pf-card-metric">
              <span className="pf-card-metric-val">{metric.value}</span>
              {metric.label && <span className="pf-card-metric-lbl">{metric.label}</span>}
            </div>
          )}
          <span className="pf-card-open">
            <i className="fas fa-arrow-right"></i>
          </span>
        </div>
        <div className="pf-card-body">
          {(p.client || p.year) && (
            <div className="pf-card-meta">
              {p.client && (
                <span>
                  <i className="fas fa-user-tie"></i> {p.client}
                </span>
              )}
              {p.year && (
                <span>
                  <i className="far fa-calendar"></i> {p.year}
                </span>
              )}
            </div>
          )}
          <h3 className="pf-card-title">{p.title}</h3>
          {excerpt && <p className="pf-card-desc">{excerpt}</p>}
          {tech.length > 0 && (
            <div className="pf-card-tags">
              {tech.map((t: string) => (
                <span key={t} className="pf-card-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          <span className="pf-card-cta">
            Смотреть кейс <i className="fas fa-arrow-right"></i>
          </span>
        </div>
      </a>
    </article>
  )
}

export async function BlogCard({ post, headingTag = 'h2', featured = false }: { post: any; headingTag?: 'h2' | 'h3'; featured?: boolean }) {
  const H = headingTag
  const cat = post.categories?.[0]
  const thumb = mediaUrl(post.cover, 'card') || mediaUrl(post.cover)
  const excerpt = (post.excerpt || '').split(/\s+/).slice(0, 22).join(' ')
  const url = paths.post(post.slug)
  const author = await postAuthor(post)
  const authorImg = mediaUrl(author.avatar, 'thumb') || mediaUrl(author.avatar)
  return (
    <article className={`blog-card${featured ? ' blog-card--featured' : ''}`} id={`post-${post.id}`}>
      {thumb ? (
        <div className="blog-card__thumb">
          <a href={url} tabIndex={-1} aria-hidden="true">
            <img src={thumb} className="blog-card__img" alt={post.title} loading="lazy" />
          </a>
          {cat && (
            <a href={paths.category(cat.slug)} className="blog-card__cat">
              {cat.name}
            </a>
          )}
        </div>
      ) : (
        <div className="blog-card__thumb blog-card__thumb--no-img">
          {cat && (
            <a href={paths.category(cat.slug)} className="blog-card__cat">
              {cat.name}
            </a>
          )}
          <div className="blog-card__no-thumb-icon">
            <i className="fas fa-pen-nib"></i>
          </div>
        </div>
      )}
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span className="blog-card__date">
            <i className="far fa-calendar-alt"></i> {formatDateRu(post.publishedAt)}
          </span>
          <span className="blog-card__reading-time">
            <i className="far fa-clock"></i> {post.readingTime || 1} мин
          </span>
        </div>
        <H className="blog-card__title">
          <a href={url}>{post.title}</a>
        </H>
        <p className="blog-card__excerpt">{excerpt}{excerpt && (post.excerpt || '').split(/\s+/).length > 22 ? '...' : ''}</p>
        <div className="blog-card__footer">
          <div className="blog-card__author">
            {authorImg ? (
              <img src={authorImg} alt="" className="author-avatar" width={32} height={32} loading="lazy" />
            ) : (
              <span className="author-avatar" aria-hidden="true">
                <i className="fas fa-user"></i>
              </span>
            )}
            <span>{author.name}</span>
          </div>
          <a href={url} className="blog-card__read-more">
            Читать <i className="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </article>
  )
}

export function TeamGrid({ team }: { team: any[] }) {
  return (
    <div className="gb-team-grid">
      {team.length ? (
        team.map((m) => {
          const photo = mediaUrl(m.photo, 'thumb') || mediaUrl(m.photo)
          const skills = (m.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean)
          return (
            <article className="gb-team-card" data-aos="fade-up" key={m.id}>
              <div className="gb-team-photo">
                {photo ? (
                  <img src={photo} alt={m.name + (m.position ? ' — ' + m.position : '')} width={400} height={400} loading="lazy" />
                ) : (
                  <div className="gb-team-initials" aria-hidden="true">
                    {m.name.slice(0, 2)}
                  </div>
                )}
                <div className="gb-team-scrim" aria-hidden="true"></div>
                <div className="gb-team-identity">
                  <h3 className="gb-team-name">{m.name}</h3>
                  {m.position && <span className="gb-team-role">{m.position}</span>}
                </div>
              </div>
              <div className="gb-team-body">
                {m.bio && <p className="gb-team-bio">{m.bio}</p>}
                {skills.length > 0 && (
                  <div className="gb-team-skills">
                    {skills.map((s: string) => (
                      <span className="gb-team-skill" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {(m.telegram || m.vk || m.github || m.linkedin) && (
                  <div className="gb-team-socials">
                    {m.telegram && (
                      <a href={m.telegram} target="_blank" rel="noopener" aria-label="Telegram">
                        <i className="fab fa-telegram"></i>
                      </a>
                    )}
                    {m.vk && (
                      <a href={m.vk} target="_blank" rel="noopener" aria-label="VK">
                        <i className="fab fa-vk"></i>
                      </a>
                    )}
                    {m.github && (
                      <a href={m.github} target="_blank" rel="noopener" aria-label="GitHub">
                        <i className="fab fa-github"></i>
                      </a>
                    )}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn">
                        <i className="fab fa-linkedin"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })
      ) : (
        <p className="gb-team-empty">Команда пока не добавлена.</p>
      )}
    </div>
  )
}

export function TestimonialsSlider({ items }: { items: any[] }) {
  return (
    <div className="testimonials-slider" id="testimonialsSlider">
      <div className="testimonials-track" id="testimonialsTrack">
        {items.map((t) => {
          const photo = mediaUrl(t.photo, 'thumb') || mediaUrl(t.photo)
          const rating = t.rating || 5
          return (
            <div className="testimonial-card" key={t.id}>
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={i < rating ? 'fas fa-star' : 'far fa-star'}></i>
                ))}
              </div>
              <div className="testimonial-text-wrap">
                <div
                  className="testimonial-text"
                  dangerouslySetInnerHTML={{
                    __html: (t.text || '')
                      .split(/\n{2,}/)
                      .map((p: string) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
                      .join(''),
                  }}
                />
                <button type="button" className="testimonial-more" aria-expanded="false">
                  <span className="testimonial-more-txt">Читать далее</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
              <div className="testimonial-author">
                {photo ? (
                  <img src={photo} alt={t.name} width={60} height={60} loading="lazy" />
                ) : (
                  <AvatarArt name={t.name} size={60} />
                )}
                <div>
                  <strong>{t.name}</strong>
                  {t.position && <span>{t.position}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="slider-controls">
        <button className="slider-btn prev" id="sliderPrev" aria-label="Предыдущий">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="slider-dots" id="sliderDots"></div>
        <button className="slider-btn next" id="sliderNext" aria-label="Следующий">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  )
}

const AV_BG = [
  ['#ff3399', '#7b2fff'],
  ['#7b2fff', '#00e5ff'],
  ['#00e5ff', '#00c27a'],
  ['#ff8a3d', '#ff3399'],
  ['#5b6cff', '#b14bff'],
  ['#00b3cc', '#5b6cff'],
]
const AV_SKIN = ['#f6d3b8', '#eec3a2', '#d9a47e', '#f9dcc6']
const AV_HAIR = ['#2b1d16', '#4a2f1d', '#1a1a22', '#7a4a26', '#c9a26a']

/** Рисованный аватар-заглушка: пока у отзыва нет фото. Вид зависит от имени. */
export function AvatarArt({ name, size = 60 }: { name: string; size?: number }) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const bg = AV_BG[h % AV_BG.length]
  const skin = AV_SKIN[(h >> 3) % AV_SKIN.length]
  const hair = AV_HAIR[(h >> 5) % AV_HAIR.length]
  const style = (h >> 8) % 3
  const id = 'av' + h.toString(36)
  return (
    <svg className="gb-avatar-art" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
        <clipPath id={id + 'c'}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="64" height="64" fill={`url(#${id})`} />
        <path d="M8 70c0-15 10-24 24-24s24 9 24 24z" fill="rgba(10,8,18,.82)" />
        <rect x="27" y="38" width="10" height="10" rx="4" fill={skin} />
        <circle cx="32" cy="28" r="12" fill={skin} />
        {style === 0 && <path d="M19 28c-1-11 5-17 13-17s14 6 13 17c-2-6-5-9-13-9s-11 3-13 9z" fill={hair} />}
        {style === 1 && <path d="M18 31c-3-14 5-21 14-21s17 7 14 21c-1-7-3-11-6-13-4 3-13 4-17 2-3 2-4 6-5 11z" fill={hair} />}
        {style === 2 && <path d="M17 40c-4-18 4-30 15-30s19 12 15 30c-1-9-2-16-5-20-5 3-15 3-20 0-3 4-4 11-5 20z" fill={hair} />}
      </g>
    </svg>
  )
}
