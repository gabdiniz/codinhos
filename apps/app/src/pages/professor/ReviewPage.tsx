import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './ReviewPage.module.css'

interface QueueItem {
  submissionId: string
  challengeId: string
  challengeTitle: string
  studentId: string
  studentName: string
  classId: string
  className: string
  attemptNumber: number
  submittedAt: string
}

interface TestResult {
  passed: boolean
  input: unknown
  expected: unknown
  actual: unknown
  description: string
}

interface SubmissionDetail {
  id: string
  attemptNumber: number
  code: string
  status: string
  testResults: TestResult[] | null
  reviewerNote: string | null
  submittedAt: string
  student?: { id: string; name: string }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<QueueItem | null>(null)
  const [detail, setDetail] = useState<SubmissionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState<'passed' | 'failed' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const res = await api.get<{ data: QueueItem[] }>(`/api/${slug}/dashboard/review-queue`)
      setQueue(res.data)
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar a fila.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { loadQueue() }, [loadQueue])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const openSubmission = useCallback(async (item: QueueItem) => {
    if (!slug) return
    setSelected(item)
    setDetail(null)
    setNote('')
    setActionError(null)
    setDetailLoading(true)
    try {
      const res = await api.get<{ data: SubmissionDetail }>(
        `/api/${slug}/challenges/${item.challengeId}/submissions/${item.submissionId}`,
      )
      setDetail(res.data)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro ao carregar submissão.')
    } finally {
      setDetailLoading(false)
    }
  }, [slug])

  async function handleReview(status: 'passed' | 'failed') {
    if (!slug || !selected) return
    setSubmitting(status)
    setActionError(null)
    try {
      await api.patch(
        `/api/${slug}/challenges/${selected.challengeId}/submissions/${selected.submissionId}/review`,
        { status, reviewerNote: note.trim() || undefined },
      )
      setQueue((q) => q.filter((i) => i.submissionId !== selected.submissionId))
      setSelected(null)
      setDetail(null)
      setToast(status === 'passed' ? 'Submissão aprovada.' : 'Submissão reprovada.')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro ao registrar revisão.')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return <div className={styles.state}><span className={styles.stateText}>// carregando fila...</span></div>
  }
  if (loadError) {
    return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>
  }

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Fila de revisão</h1>
        <p className={styles.pageSubtitle}>
          {queue.length} {queue.length === 1 ? 'submissão aguardando' : 'submissões aguardando'} revisão
        </p>
      </header>

      {queue.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✓</span>
          <p className={styles.emptyTitle}>Tudo revisado!</p>
          <p className={styles.emptyText}>Nenhuma submissão aguardando revisão manual.</p>
        </div>
      ) : (
        <div className={styles.split}>
          {/* Lista */}
          <ul className={styles.list}>
            {queue.map((item) => (
              <li key={item.submissionId}>
                <button
                  className={`${styles.queueItem} ${selected?.submissionId === item.submissionId ? styles.queueItemActive : ''}`}
                  onClick={() => openSubmission(item)}
                >
                  <div className={styles.avatar}>{initials(item.studentName)}</div>
                  <div className={styles.queueInfo}>
                    <span className={styles.queueStudent}>{item.studentName}</span>
                    <span className={styles.queueChallenge}>{item.challengeTitle}</span>
                    <span className={styles.queueMeta}>{item.className} · tentativa {item.attemptNumber}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Painel de detalhe */}
          <div className={styles.panel}>
            {!selected ? (
              <div className={styles.panelEmpty}>
                <span className={styles.stateText}>Selecione uma submissão para revisar.</span>
              </div>
            ) : detailLoading ? (
              <div className={styles.panelEmpty}>
                <span className={styles.stateText}>// carregando submissão...</span>
              </div>
            ) : detail ? (
              <>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>{selected.challengeTitle}</h2>
                  <span className={styles.panelMeta}>
                    {selected.studentName} · {selected.className}
                  </span>
                </div>

                <div className={styles.codeBlock}>
                  <div className={styles.codeLabel}>// código submetido</div>
                  <pre className={styles.code}>{detail.code}</pre>
                </div>

                {detail.testResults && detail.testResults.length > 0 && (
                  <div className={styles.tests}>
                    <div className={styles.codeLabel}>// resultado dos testes</div>
                    {detail.testResults.map((t, i) => (
                      <div key={i} className={styles.testRow}>
                        <span className={t.passed ? styles.testPass : styles.testFail}>
                          {t.passed ? '✓' : '✗'}
                        </span>
                        <span className={styles.testDesc}>{t.description}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.reviewForm}>
                  <textarea
                    className={styles.noteInput}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Feedback para o aluno (opcional)..."
                    rows={3}
                  />
                  {actionError && <p className={styles.formError}>{actionError}</p>}
                  <div className={styles.reviewActions}>
                    <button
                      className={styles.btnReject}
                      onClick={() => handleReview('failed')}
                      disabled={submitting !== null}
                    >
                      {submitting === 'failed' ? 'Reprovando...' : 'Reprovar'}
                    </button>
                    <button
                      className={styles.btnApprove}
                      onClick={() => handleReview('passed')}
                      disabled={submitting !== null}
                    >
                      {submitting === 'passed' ? 'Aprovando...' : 'Aprovar'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.panelEmpty}>
                <span className={styles.stateError}>{actionError ?? 'Erro ao carregar.'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
