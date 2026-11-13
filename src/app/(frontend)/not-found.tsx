import { av } from '@/lib/asset'
import LegacyScripts from '@/components/LegacyScripts'

/** 404.php — страница «не найдено» с игрой Neon Rider */
export default function NotFound() {
  return (
    <main id="main" role="main">
      <link rel="stylesheet" href={av("/legacy/css/inline-page-404-0.css")} precedence="default" />
      <div className="page-404">
        <div className="page-404__inner">
          <div className="page-404__hero" id="hero404">
            <span className="page-404__code">404</span>
            <h1 className="page-404__title">Страница не найдена</h1>
            <p className="page-404__desc">
              К сожалению, запрашиваемая страница не существует.
              <br />
              Возможно, она была перемещена или удалена.
            </p>
            <p className="page-404__hint-start" id="hintStart">
              Нажми пробел, Enter, стрелки или кликни — сыграй в Neon Rider
            </p>
          </div>
          <div className="tron-wrap" id="tronWrap">
            <canvas id="tron-canvas"></canvas>
          </div>
          <div className="tron-hud" id="tronHud">
            <div className="tron-hud__stats">
              <div className="tron-hud__item">
                <span className="tron-hud__label">СЧЁТ</span>
                <span className="tron-hud__val" id="tronScore">
                  0
                </span>
              </div>
              <div className="tron-hud__item tron-hud__center">
                <span id="tronMsg"></span>
              </div>
              <div className="tron-hud__item tron-hud__right">
                <span className="tron-hud__label">РЕКОРД</span>
                <span className="tron-hud__val" id="tronBest">
                  0
                </span>
              </div>
            </div>
            <div className="tron-toolbar">
              <div className="tron-difficulty" aria-label="Уровень сложности">
                <button type="button" className="tron-difficulty__btn" data-level="easy">
                  Легко
                </button>
                <button type="button" className="tron-difficulty__btn is-active" data-level="normal">
                  Норма
                </button>
                <button type="button" className="tron-difficulty__btn" data-level="hard">
                  Сложно
                </button>
              </div>
              <div className="tron-toolbar__actions">
                <button type="button" className="tron-action-btn" id="tronPauseBtn">
                  Пауза
                </button>
              </div>
            </div>
          </div>
          <div className="tron-state-panel" id="tronGameState" data-state="idle">
            <div className="tron-state-panel__title" id="tronGameStateTitle">
              Neon Rider
            </div>
            <div className="tron-state-panel__text" id="tronGameStateText">
              Выбери сложность и начни заезд.
            </div>
            <div className="tron-state-panel__meta" id="tronGameStateMeta">
              Стрелки / WASD / свайп · P или Esc — пауза
            </div>
            <div className="tron-state-panel__actions">
              <button type="button" className="tron-play-btn" id="tronRestartBtn">
                Играть ещё
              </button>
            </div>
          </div>
          <div className="page-404__actions">
            <a href="/" className="btn btn-primary">
              <i className="fas fa-home"></i>
              <span>На главную</span>
            </a>
            <a href="/contacts/" className="btn btn-outline">
              <span>Написать нам</span>
            </a>
          </div>
        </div>
      </div>
      <LegacyScripts src={['/legacy/js/inline-page-404-0.js']} />
    </main>
  )
}
