# Tokens & Paleta — Landing Page (apps/web)

Sistema de cores da LP pública do Codinhos. Direção **híbrido tech-lúdico**, com **tema claro e escuro**. Implementação em `apps/web/src/app/globals.css`.

> Regra do projeto: nenhuma cor fixa fora do arquivo de tokens — sempre `var(--color-*)`. Ver `agent_docs/theming.md`.

---

## Como funciona (arquitetura de 2 camadas)

A ideia central: **componentes nunca conhecem cores, só papéis.** Um botão não sabe que é "indigo #6366f1"; ele sabe que usa `--color-primary`. Trocar o tema é trocar o que esse papel aponta — nada nos componentes muda.

Isso é organizado em duas camadas:

**1. Primitivas** — a paleta crua, os valores hex de verdade. Ex.: `--indigo-500: #6366f1`. Não mudam com o tema; são o "catálogo de tintas".

**2. Semânticos** — os papéis que a UI usa. Ex.: `--color-primary`, `--color-background`, `--color-text`. Cada um **aponta** para uma primitiva, e esse apontamento **muda entre light e dark**.

```
Componente  →  Semântico            →  Primitiva        →  valor
button      →  var(--color-primary) →  var(--indigo-600)→  #5b4ef0   (light)
button      →  var(--color-primary) →  var(--indigo-400)→  #818cf8   (dark)
```

O componente escreve sempre `background: var(--color-primary)`. No light ele vira indigo escuro; no dark, indigo claro. O componente não muda.

### Por que separar assim

- **Trocar tema = reapontar semânticos.** O bloco `[data-theme="dark"]` só redefine os `--color-*`; as primitivas e os componentes ficam intactos.
- **Consistência.** Toda a UI puxa das mesmas primitivas — nada de dez tons de azul soltos.
- **Compatível com o app interno.** Os nomes semânticos (`--color-primary`, `--color-surface`, ...) são os mesmos de `apps/app`, então `packages/ui` funciona nos dois. A diferença: na LP os valores são fixos (marca Codinhos); no app, o tenant injeta os dele em runtime.

---

## Light e dark — o toggle

O tema ativo é definido por um atributo no `<html>`:

- **Sem atributo / padrão** → tema **claro** (definido em `:root`).
- **`<html data-theme="dark">`** → tema **escuro** (bloco `[data-theme="dark"]` sobrescreve os semânticos).

Recomendação de implementação: **[next-themes](https://github.com/pacocoursey/next-themes)** com `attribute="data-theme"`. Ele:
- resolve a preferência do sistema (`prefers-color-scheme`) para o atributo automaticamente — por isso não duplicamos as cores num `@media`;
- persiste a escolha manual do usuário;
- injeta o valor antes da hidratação, evitando o "flash" de tema errado (FOUC).

Sem lib, dá para setar `data-theme` na `<html>` via script inline no `<head>` lendo `localStorage`/`prefers-color-scheme` — mas a lib resolve o FOUC de graça.

O `color-scheme: light/dark` em cada bloco também ajusta controles nativos (scrollbars, inputs) ao tema.

---

## A paleta

Três cores de marca sustentam o híbrido: **indigo** (autoridade tech), **violet** (compõe o gradiente) e **lime** (o pop lúdico / "código" / CTA de destaque). **Pink** entra só como pop de gamificação. Neutros frios reforçam a vibe tech.

### Marca

| Papel | Token | Light | Dark |
|---|---|---|---|
| Primária (tech) | `--color-primary` | `#5b4ef0` | `#818cf8` |
| Primária hover | `--color-primary-hover` | `#4a3dd6` | `#a5b4fc` |
| Sobre a primária | `--color-on-primary` | `#ffffff` | `#0b0e16` |
| Secundária | `--color-secondary` | `#8b5cf6` | `#a78bfa` |
| Acento (lúdico/CTA) | `--color-accent` | `#84cc16` | `#a3e635` |
| Sobre o acento | `--color-on-accent` | `#0b0e16` | `#0b0e16` |
| Pop (gamificação) | `--color-pop` | `#ec4899` | `#f472b6` |

No dark, primária e acento ficam **mais claros** de propósito — cor saturada sobre fundo escuro precisa clarear para manter contraste e "brilhar".

### Layout

| Papel | Token | Light | Dark |
|---|---|---|---|
| Fundo da página | `--color-background` | `#f7f8fc` | `#0b0e16` |
| Superfície (cards) | `--color-surface` | `#ffffff` | `#141824` |
| Superfície elevada | `--color-surface-raised` | `#ffffff` | `#1c2130` |
| Borda / divisor | `--color-border` | `#e4e6f0` | `#272d3d` |

Dark usa **off-black `#0b0e16`**, não preto puro — reduz a vibração visual e dá camadas (fundo → surface → raised).

### Texto

| Papel | Token | Light | Dark |
|---|---|---|---|
| Principal | `--color-text` | `#0f1420` | `#edf0f7` |
| Secundário | `--color-text-muted` | `#5c5f7a` | `#9aa1b8` |
| Sobre cor | `--color-text-inverse` | `#ffffff` | `#0b0e16` |

### Feedback

`--color-success` · `--color-error` · `--color-warning` · `--color-info` — versões mais claras no dark. `warning` é âmbar e **não** colide com o acento (lime), justamente por isso o acento não é amarelo.

### Efeitos de marca (LP)

- `--gradient-brand` — indigo→violet, para títulos/CTAs.
- `--gradient-hero` — glow radial suave no topo do hero.
- `--glow-primary`, `--glow-accent` — sombras coloridas (halo) em botões/badges.
- `--code-*` — syntax highlight dos snippets de código (bg, keyword, string, fn, number, comment) em versão light e dark.

### Independentes de tema

`--font-sans` (Inter), `--font-mono` (JetBrains Mono), raios (`--radius-*`), transições (`--transition-*`) e sombras neutras. Sombras são **suaves no light** e **profundas no dark**.

---

## Como usar

```css
/* CORRETO — sempre semântico */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--glow-primary);
}
.btn-primary:hover { background: var(--color-primary-hover); }

.badge-xp {
  background: var(--color-pop);
  color: var(--color-text-inverse);
}

/* ERRADO — proibido */
.btn-primary { background: #5b4ef0; }        /* hex fixo */
.btn-primary { background: var(--indigo-600); } /* primitiva direto na UI */
```

Regra prática: **UI usa `--color-*` (e efeitos de marca); nunca as primitivas `--indigo-*` diretamente.** As primitivas só existem para alimentar os semânticos.

---

## Acessibilidade

- Contraste alvo **AA** nos dois temas. Os acentos saturados (lime) já vêm pareados com `--color-on-accent` escuro; ao usar lime como **texto** sobre fundo claro, prefira `--lime-600`.
- `prefers-reduced-motion: reduce` já está tratado no `globals.css` (zera animações/transições) — animações da LP devem respeitar isso (ver `docs/pesquisa-lp-vendas.md`, §5).

---

## Pendências

- Validar contraste AA de todos os pares nos dois temas (ferramenta automatizada).
- Definir se o mascote **Codi** tem cor própria fixa ou deriva da paleta.
- Fechar famílias tipográficas (Inter/JetBrains Mono é a hipótese atual).
