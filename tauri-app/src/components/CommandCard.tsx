import { FC, SyntheticEvent } from 'react'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { Command, defaultImage, mediaUrl } from '../api'

interface Props {
  command: Command
}

// При недоступном объекте в MinIO подставляется изображение по умолчанию
export const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget
  if (!image.src.endsWith('/defaults/image.svg')) image.src = defaultImage()
}

// Карточка команды: изображение ведёт на страницу «Подробнее»
export const CommandCard: FC<Props> = ({ command }) => (
  <Card as="article" className="instruction-card">
    <Link to={`/commands/${command.id}`}>
      <Card.Img
        className="instruction-card__image"
        src={mediaUrl(command.image_url)}
        onError={handleImageError}
        alt={`Схема команды ${command.mnemonic}`}
        loading="lazy"
      />
    </Link>
    <Card.Body>
      <Card.Title as="h2">{command.mnemonic}</Card.Title>
      <div className="instruction-card__meta">
        <span className="badge">{command.operand_count} · {command.length_bits} бит</span>
        <span aria-label={`${command.like_count} отметок нравится`}>♡ {command.like_count}</span>
      </div>
      <Link to={`/commands/${command.id}`} className="card-more">Подробнее →</Link>
    </Card.Body>
  </Card>
)
