import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'

import { Command, getCommand, mediaUrl } from '../api'
import { handleImageError } from '../components/CommandCard'

// Страница «Подробнее»: изображение, описание и параметры одной команды
export function CommandDetailPage() {
  const { id } = useParams()
  const [command, setCommand] = useState<Command | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getCommand(Number(id))
      .then(setCommand)
      .catch((e: Error) => setError(e.message))
  }, [id])

  return (
    <main className="page-view">
      <section className="page-content">
        <nav className="detail-toolbar" aria-label="Навигация">
          <Link to="/" className="toolbar-button">← К списку</Link>
          <span className="toolbar-crumb">Подробнее</span>
        </nav>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!command && !error && <div className="loading-indicator"><Spinner animation="border" role="status" /></div>}
        {command && (
          <article className="detail">
            <img
              src={mediaUrl(command.image_url)}
              onError={handleImageError}
              alt={`Схема команды ${command.mnemonic}`}
            />
            <div className="detail__body">
              <div className="detail__head">
                <h1>{command.mnemonic}</h1>
                <span aria-label={`${command.like_count} отметок нравится`}>♡ {command.like_count}</span>
              </div>
              <dl className="detail-properties">
                <div><dt>Операндов</dt><dd>{command.operand_count}</dd></div>
                <div><dt>Длина команды</dt><dd>{command.length_bits} бит</dd></div>
              </dl>
              <p>{command.description}</p>
              {command.description_en && <p className="description-en">{command.description_en}</p>}
            </div>
          </article>
        )}
      </section>
    </main>
  )
}
