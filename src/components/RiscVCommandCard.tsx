import { FC } from 'react'
import { Button, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import { useMediaFallback } from '../hooks/useMediaFallback'
import { DEFAULT_IMAGE_URL } from '../modules/media'
import type { RiscVCommandListItem } from '../modules/riscvCommand'
import { feedURL } from '../Routes'

interface Props {
  riscvCommand: RiscVCommandListItem
  onDelete?: () => void
  isDeleting?: boolean
}

// Карточка команды на странице плитки: изображение ведёт в ленту на эту команду
export const RiscVCommandCard: FC<Props> = ({ riscvCommand, onDelete, isDeleting }) => {
  const { id, mnemonic, image_url, operand_count, length_bits, like_count } = riscvCommand
  const image = useMediaFallback(image_url, DEFAULT_IMAGE_URL)

  return (
    <Card as="article" className="instruction-card">
      <Link to={feedURL(id)}>
        <Card.Img
          className="instruction-card__image"
          src={image.source}
          onError={image.handleError}
          alt={`Схема команды ${mnemonic}`}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <Card.Body>
        <Card.Title as="h2">{mnemonic}</Card.Title>
        <div className="instruction-card__meta">
          <span className="badge">
            {operand_count} · {length_bits} бит
          </span>
          <span aria-label={`${like_count} отметок нравится`}>♡ {like_count}</span>
        </div>
        {onDelete && (
          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            className="instruction-card__delete"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаляем…' : 'Удалить'}
          </Button>
        )}
      </Card.Body>
    </Card>
  )
}
