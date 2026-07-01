import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api.ts'
import styles from './CertificatesPage.module.css'

interface Trail { id: string; title: string }
interface Config {
  accentColor?: string
  textColor?: string
  backgroundColor?: string
  title?: string
  bodyText?: string
  message?: string
  signatureName?: string
  signatureRole?: string
  logoDataUrl?: string
  showSchoolName?: boolean
}
interface Template { id: string; trailId: string | null; enabled: boolean; config: Config }

const DEFAULTS: Required<Pick<Config, 'accentColor' | 'textColor' | 'title' | 'bodyText' | 'showSchoolName'>> = {
  accentColor: '#4f46e5',
  textColor: '#1f2937',
  title: 'Certificado de Conclusão',
  bodyText: 'por concluir a trilha',
  showSchoolName: true,
}
const DEFAULT_SCOPE = '__default__'
const MAX_LOGO = 500 * 1024 // ~500KB

export default function CertificatesPage() {
  const { slug } = useParams<{ slug: string }>()
  const [trails, setTrails] = useState<Trail[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [schoolName, setSchoolName] = useState('Sua Escola')
  const [scope, setScope] = useState<string>(DEFAULT_SCOPE) // DEFAULT_SCOPE ou trailId
  const [enabled, setEnabled] = useState(true)
  const [cfg, setCfg] = useState<Config>({})
  const [useBg, setUseBg] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoadError(null)
    try {
      const [tplRes, trRes, setRes] = await Promise.all([
        api.get<{ data: Template[] }>(`/api/${slug}/certificates/templates`),
        api.get<{ data: Trail[] }>(`/api/${slug}/trails`),
        api.get<{ data: { settings: { name: string } } }>(`/api/${slug}/settings`),
      ])
      setTemplates(tplRes.data)
      setTrails(trRes.data)
      setSchoolName(setRes.data.settings.name || 'Sua Escola')
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Erro ao carregar.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Carrega o template do escopo selecionado no formulário
  const currentTemplate = useMemo(
    () => templates.find((t) => (t.trailId ?? DEFAULT_SCOPE) === scope) ?? null,
    [templates, scope],
  )
  useEffect(() => {
    const c = currentTemplate?.config ?? {}
    setCfg(c)
    setEnabled(currentTemplate ? currentTemplate.enabled : true)
    setUseBg(!!c.backgroundColor)
  }, [currentTemplate, scope])

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }))
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_LOGO) { setToast('Logo muito grande (máx. ~500KB).'); return }
    const reader = new FileReader()
    reader.onload = () => set('logoDataUrl', String(reader.result))
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!slug) return
    setSaving(true)
    try {
      const config: Config = { ...cfg }
      if (!useBg) delete config.backgroundColor
      const trailId = scope === DEFAULT_SCOPE ? null : scope
      await api.put(`/api/${slug}/certificates/templates`, { trailId, enabled, config })
      setToast('Certificado salvo.')
      await load()
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function removeOverride() {
    if (!slug || !currentTemplate || scope === DEFAULT_SCOPE) return
    setSaving(true)
    try {
      await api.delete(`/api/${slug}/certificates/templates/${currentTemplate.id}`)
      setToast('Personalização removida — este curso volta a usar o padrão da escola.')
      setScope(DEFAULT_SCOPE)
      await load()
    } catch (err) {
      setToast(err instanceof ApiError ? err.message : 'Erro ao remover.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.state}><span className={styles.stateText}>// carregando...</span></div>
  if (loadError) return <div className={styles.state}><span className={styles.stateError}>{loadError}</span></div>

  const accent = cfg.accentColor || DEFAULTS.accentColor
  const ink = cfg.textColor || DEFAULTS.textColor
  const bg = useBg ? (cfg.backgroundColor || '#ffffff') : '#ffffff'
  const title = cfg.title || DEFAULTS.title
  const bodyText = cfg.bodyText || DEFAULTS.bodyText
  const showSchool = cfg.showSchoolName ?? DEFAULTS.showSchoolName
  const sampleCourse = scope === DEFAULT_SCOPE ? 'Nome do Curso' : (trails.find((t) => t.id === scope)?.title ?? 'Curso')
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className={styles.root}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Certificados</h1>
          <p className={styles.pageSubtitle}>Personalize o certificado emitido quando o aluno conclui um curso.</p>
        </div>
      </header>

      {/* Escopo */}
      <div className={styles.scopeBar}>
        <label className={styles.scopeLabel}>Editando:</label>
        <select className={styles.scopeSelect} value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value={DEFAULT_SCOPE}>Padrão da escola (todos os cursos)</option>
          {trails.map((t) => {
            const has = templates.some((tp) => tp.trailId === t.id)
            return <option key={t.id} value={t.id}>{t.title}{has ? ' • personalizado' : ''}</option>
          })}
        </select>
        {scope !== DEFAULT_SCOPE && currentTemplate && (
          <button className={styles.btnGhost} onClick={removeOverride} disabled={saving}>Usar o padrão da escola</button>
        )}
      </div>

      <div className={styles.layout}>
        {/* Formulário */}
        <div className={styles.form}>
          <div className={styles.toggleRow}>
            <div>
              <span className={styles.fieldLabel}>Emitir certificado neste escopo</span>
              <p className={styles.hint}>Se desligado, alunos que concluírem {scope === DEFAULT_SCOPE ? 'cursos sem personalização' : 'este curso'} não recebem certificado.</p>
            </div>
            <label className={styles.switch}>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              <span className={styles.switchTrack}><span className={styles.switchThumb} /></span>
            </label>
          </div>

          <div className={styles.row2}>
            <label className={styles.field}>Cor de destaque
              <input type="color" className={styles.color} value={accent} onChange={(e) => set('accentColor', e.target.value)} />
            </label>
            <label className={styles.field}>Cor do texto
              <input type="color" className={styles.color} value={ink} onChange={(e) => set('textColor', e.target.value)} />
            </label>
          </div>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={useBg} onChange={(e) => setUseBg(e.target.checked)} />
            Usar cor de fundo
            {useBg && <input type="color" className={styles.colorSm} value={cfg.backgroundColor || '#ffffff'} onChange={(e) => set('backgroundColor', e.target.value)} />}
          </label>

          <label className={styles.field}>Título
            <input className={styles.input} value={cfg.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder={DEFAULTS.title} maxLength={80} />
          </label>
          <label className={styles.field}>Texto do corpo
            <input className={styles.input} value={cfg.bodyText ?? ''} onChange={(e) => set('bodyText', e.target.value)} placeholder={DEFAULTS.bodyText} maxLength={120} />
            <small className={styles.hint}>Aparece entre o nome do aluno e o nome do curso.</small>
          </label>
          <label className={styles.field}>Mensagem (opcional)
            <textarea className={styles.input} value={cfg.message ?? ''} onChange={(e) => set('message', e.target.value)} rows={2} maxLength={200} placeholder="Ex.: Parabéns pela dedicação!" />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>Assinatura — nome
              <input className={styles.input} value={cfg.signatureName ?? ''} onChange={(e) => set('signatureName', e.target.value)} maxLength={80} placeholder="Ex.: Maria Diretora" />
            </label>
            <label className={styles.field}>Assinatura — cargo
              <input className={styles.input} value={cfg.signatureRole ?? ''} onChange={(e) => set('signatureRole', e.target.value)} maxLength={80} placeholder="Ex.: Diretora" />
            </label>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Logo da escola</span>
            <div className={styles.logoRow}>
              <button type="button" className={styles.btnGhost} onClick={() => fileRef.current?.click()}>Enviar logo</button>
              {cfg.logoDataUrl && <button type="button" className={styles.btnGhostSm} onClick={() => set('logoDataUrl', undefined)}>Remover</button>}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onLogo} />
            </div>
            <small className={styles.hint}>PNG ou JPG, até ~500KB.</small>
          </div>

          <label className={styles.checkRow}>
            <input type="checkbox" checked={showSchool} onChange={(e) => set('showSchoolName', e.target.checked)} />
            Mostrar o nome da escola no rodapé
          </label>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar certificado'}</button>
          </div>
        </div>

        {/* Preview */}
        <div className={styles.previewWrap}>
          <span className={styles.previewCaption}>Prévia</span>
          <div className={styles.cert} style={{ background: bg, borderColor: accent }}>
            <div className={styles.certInner} style={{ borderColor: '#c7d2fe' }}>
              {cfg.logoDataUrl
                ? <img src={cfg.logoDataUrl} alt="logo" className={styles.certLogo} />
                : <div className={styles.certBrand} style={{ color: accent }}>{'{ cod }'}</div>}
              <div className={styles.certTitle} style={{ color: ink }}>{title}</div>
              <div className={styles.certMuted}>Este certificado é concedido a</div>
              <div className={styles.certName} style={{ color: ink }}>Ana Silva</div>
              <div className={styles.certMuted}>{bodyText}</div>
              <div className={styles.certCourse} style={{ color: accent }}>{sampleCourse}</div>
              {cfg.message && <div className={styles.certMsg}>{cfg.message}</div>}
              {cfg.signatureName && (
                <div className={styles.certSig}>
                  <div className={styles.certSigLine} style={{ background: ink }} />
                  <div className={styles.certSigName} style={{ color: ink }}>{cfg.signatureName}</div>
                  {cfg.signatureRole && <div className={styles.certMuted}>{cfg.signatureRole}</div>}
                </div>
              )}
              <div className={styles.certFooter}>{showSchool ? `${schoolName}  ·  ${today}` : today}</div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
