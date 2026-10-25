import { FC, SyntheticEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMediaFallback } from '../hooks/useMediaFallback'
import { DEFAULT_IMAGE_URL, DEFAULT_VIDEO_URL } from '../modules/media'
import type { RiscVCommand } from '../modules/riscvCommandsApi'
import { feedURL } from '../Routes'

interface Props {
  riscvCommand: RiscVCommand
  nextId: number
}

// Экран ленты одной команды: видео, описание, параметры, лайки и переход к следующей
export const RiscVCommandFeedView: FC<Props> = ({ riscvCommand, nextId }) => {
  const { mnemonic, description, operand_count, length_bits, like_count } = riscvCommand
  const video = useMediaFallback(riscvCommand.video_url, DEFAULT_VIDEO_URL)
  const poster = useMediaFallback(riscvCommand.image_url, DEFAULT_IMAGE_URL)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleTimeUpdate = (event: SyntheticEvent<HTMLVideoElement>) => {
    const { currentTime, duration } = event.currentTarget
    setProgress(duration ? currentTime / duration : 0)
  }

  return (
    <>
      <video
        className="feed-video"
        src={video.source}
        poster={poster.source}
        onError={video.handleError}
        onTimeUpdate={handleTimeUpdate}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        Ваш браузер не поддерживает воспроизведение видео.
      </video>
      {/* У постера нет события ошибки: скрытое изображение проверяет, доступен ли он */}
      <img
        className="visually-hidden"
        src={poster.source}
        onError={poster.handleError}
        alt=""
        aria-hidden="true"
      />
      <div className="feed-shade" />
      <section className="feed-content">
        <div className="feed-progress" aria-hidden="true">
          <span className="feed-progress__value" style={{ transform: `scaleX(${progress})` }} />
        </div>
        <p className="feed-eyebrow">
          <span />
          {mnemonic}
        </p>
        <div className="feed-information">
          <button
            type="button"
            className="feed-description"
            aria-expanded={isDescriptionExpanded}
            onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
          >
            {isDescriptionExpanded ? (
              <span className="feed-description-expanded">
                {description} <span className="feed-description-toggle">меньше</span>
              </span>
            ) : (
              <span className="feed-description-collapsed">
                <span className="feed-description-text">{description}</span>
                <span className="feed-description-toggle">ещё</span>
              </span>
            )}
          </button>
          <div className="feed-actions">
            <div className="feed-like" aria-label={`${like_count} отметок нравится`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
              <small>{like_count}</small>
            </div>
            <dl className="feed-properties" aria-label="Параметры инструкции">
              <div>
                <dt className="visually-hidden">Операнды</dt>
                <dd>{operand_count}</dd>
              </div>
              <div>
                <dt className="visually-hidden">Длина</dt>
                <dd>{length_bits} бит</dd>
              </div>
            </dl>
            <Link
              className="feed-next"
              to={feedURL(nextId)}
              aria-label="Следующая команда"
              title="Следующая команда"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m8 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
