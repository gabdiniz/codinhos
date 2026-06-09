# Theming

O visual da plataforma é configurável por tenant. Toda identidade visual usa **variáveis CSS** — nenhuma cor pode ser valor fixo no código.

## Regra obrigatória

```css
/* CORRETO */
color: var(--color-primary);
background-color: var(--color-surface);
border-color: var(--color-border);

/* ERRADO — proibido em qualquer componente */
color: #3b82f6;
background-color: white;
border-color: #e5e7eb;
```

Isso vale para `web` e `app`, em qualquer arquivo `.css`, `.tsx` ou estilo inline.

## Como o tema é carregado

Na inicialização do app, o frontend lê o slug da URL (`/:slug/...`), busca o tema do tenant via API e injeta as variáveis no `:root` do documento. Enquanto o tema não carrega, aplica o tema padrão da plataforma.

```typescript
// Exemplo de injeção
const applyTheme = (theme: TenantTheme) => {
  const root = document.documentElement
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
```

## Variáveis obrigatórias

Todos os tenants devem ter todas estas variáveis definidas (o Super Admin define os valores padrão):

```css
:root {
  /* Marca */
  --color-primary:       /* cor principal do tenant */
  --color-primary-hover: /* versão hover da cor principal */
  --color-secondary:     /* cor de apoio */
  --color-accent:        /* destaque, CTAs secundários */

  /* Layout */
  --color-background:    /* fundo da página */
  --color-surface:       /* fundo de cards, modais, painéis */
  --color-border:        /* bordas e divisores */

  /* Texto */
  --color-text:          /* texto principal */
  --color-text-muted:    /* texto secundário, placeholders */
  --color-text-inverse:  /* texto sobre fundo colorido */

  /* Feedback */
  --color-success:       /* confirmações, acertos */
  --color-error:         /* erros, falhas */
  --color-warning:       /* avisos */
  --color-info:          /* informações neutras */
}
```

## Quem pode alterar o tema

- **Super Admin** — define o tema padrão da plataforma e pode sobrescrever qualquer tenant
- **Gestor do Tenant** — personaliza as variáveis do seu tenant via dashboard
