import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './NotificationBell.module.css'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  readAt: string | null
  createdAt: string
}

interface ListResponse {
  data: NotificationItem[]
  meta: { total: number; page: number; limit: number }
}

const PAGE_SIZE = 10
const POLL_INTERVAL_MS = 45_000
const PANEL_WIDTH = 340

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formata um timestamp ISO como tempo relativo curto, em PT-BR. */
function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'ontem'
  if (diffD < 7) return `há ${diffD} dias`
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Ícone ────────────────────────────────────────────────────────────────────

function IconBell() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ─── NotificationBell ─────────────────────────────────────────────────────────
// Sino de notificações da área do usuário (sidebar). Consome só endpoints já
// existentes do módulo `notifications` — sem rota nova. O painel é renderizado
// via portal em document.body, com position: fixed, pra não ser cortado pelo
// `overflow: hidden` da sidebar.

export function NotificationBell() {
  const { slug } = useParams<{ slug: string }>()

  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number } | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [panelPos, setPanelPos] = useState<{ left: number; bottom: number } | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Contagem de não lidas — busca ao montar e a cada 45s
  useEffect(() => {
    if (!slug) return
    let cancelled = false

    function loadCount() {
      api
        .get<{ data: { count: number } }>(`/api/${slug}/notifications/unread-count`)
        .then((res) => {
          if (!cancelled) setUnreadCount(res.data.count)
        })
        .catch(() => {
          // Falha silenciosa — o sino não é crítico pro fluxo principal
        })
    }

    loadCount()
    const interval = setInterval(loadCount, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [slug])

  const loadNotifications = useCallback(
    (page: number) => {
      if (!slug) return
      setListLoading(true)
      setListError(null)
      api
        .get<ListResponse>(`/api/${slug}/notifications?page=${page}&limit=${PAGE_SIZE}`)
        .then((res) => {
          setNotifications((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
          setMeta({ total: res.meta.total, page: res.meta.page })
        })
        .catch((err) => {
          setListError(
            err instanceof ApiError ? err.message : 'Não foi possível carregar as notificações.',
          )
        })
        .finally(() => setListLoading(false))
    },
    [slug],
  )

  // Abre/fecha o painel — ao abrir, calcula posição (fixed, fora do overflow da
  // sidebar) e recarrega a primeira página pra garantir dados frescos.
  const handleToggle = useCallback(() => {
    if (open) {
      setOpen(false)
      return
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      let left = rect.left
      if (left + PANEL_WIDTH > window.innerWidth - 16) left = window.innerWidth - PANEL_WIDTH - 16
      if (left < 16) left = 16
      setPanelPos({ left, bottom: window.innerHeight - rect.top + 8 })
    }
    setOpen(true)
    loadNotifications(1)
  }, [open, loadNotifications])

  // Fecha ao clicar fora ou pressionar Esc
  useEffect(() => {
    if (!open) return

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleMarkRead(item: NotificationItem) {
    if (!slug || item.readAt) return
    try {
      const res = await api.patch<{ data: { notification: { id: string; readAt: string } } }>(
        `/api/${slug}/notifications/${item.id}/read`,
      )
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: res.data.notification.readAt } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Mantém o item como está — o próximo poll de contagem corrige
    }
  }

  async function handleMarkAllRead() {
    if (!slug || markingAll || unreadCount === 0) return
    setMarkingAll(true)
    try {
      await api.patch<{ data: { updated: number } }>(`/api/${slug}/notifications/read-all`)
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })))
      setUnreadCount(0)
    } catch {
      // silencioso — o próximo poll de contagem corrige
    } finally {
      setMarkingAll(false)
    }
  }

  const hasMore = meta ? notifications.length < meta.total : false

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.bell}
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notificações — ${unreadCount} não lidas` : 'Notificações'}
        aria-expanded={open}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open &&
        panelPos &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{ left: panelPos.left, bottom: panelPos.bottom }}
            role="dialog"
            aria-label="Notificações"
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Notificações</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.markAllBtn}
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                >
                  marcar todas como lidas
                </button>
              )}
            </div>

            <div className={styles.panelList}>
              {listLoading && notifications.length === 0 && (
                <p className={styles.panelState}>Carregando...</p>
              )}
              {listError && notifications.length === 0 && (
                <p className={styles.panelStateError}>{listError}</p>
              )}
              {!listLoading && !listError && notifications.length === 0 && (
                <p className={styles.panelState}>Nenhuma notificação por aqui.</p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`${styles.item} ${n.readAt ? '' : styles.itemUnread}`}
                  onClick={() => handleMarkRead(n)}
                >
                  {!n.readAt && <span className={styles.itemDot} aria-hidden="true" />}
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    {n.body && <span className={styles.itemText}>{n.body}</span>}
                    <span className={styles.itemTime}>{formatRelativeTime(n.createdAt)}</span>
                  </span>
                </button>
              ))}
              {hasMore && (
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  onClick={() => meta && loadNotifications(meta.page + 1)}
                  disabled={listLoading}
                >
                  {listLoading ? 'carregando...' : 'carregar mais'}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
