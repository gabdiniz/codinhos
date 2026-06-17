# Planejamento — App de Ensino de Programação para Crianças

> Documento de referência de produto. Registra teoria, funcionalidades, fluxos e priorização.
> Público-alvo inicial: 11–14 anos. Modelo de negócio: B2B (escolas).

---

## Visão Geral

Plataforma multi-tenant para ensinar programação a crianças, com trilhas configuráveis, sandbox interativo, gamificação forte e tutor de IA. Escolas (tenants) personalizam a experiência para suas turmas; alunos aprendem por desafios práticos com feedback imediato.

**Idioma:** PT-BR como padrão. Multi-idioma fora do escopo atual.

---

## Atores do Sistema

| Ator | Responsabilidades |
|---|---|
| **Super Admin** | Cria e gerencia tenants, define planos, acesso global à plataforma |
| **Gestor do Tenant** | Configura trilhas, cria turmas, gerencia alunos, acompanha progresso |
| **Professor** *(V2)* | Acompanha turma, revisa submissões, libera módulos manualmente |
| **Aluno** | Consome conteúdo, resolve desafios, usa sandbox e chat IA |

---

## Linguagem e Abstração de Engine

- **Linguagem inicial:** JavaScript
- **Arquitetura:** engine de sandbox agnóstica de linguagem desde o início — cada linguagem tem seu próprio executor, mas a interface (enviar código → receber output/erro) é sempre a mesma
- **Expansão futura:** Python (V2), outras linguagens via plug-in de executor

---

## Trilhas de Aprendizagem

### Estrutura de uma trilha

Cada trilha é composta por **módulos sequenciais**. Cada módulo contém:

1. **Conceito** — explicação curta da lógica (ex: "o que é uma variável")
2. **Exemplo guiado** — código pronto com anotações
3. **Desafio** — o aluno escreve ou modifica código para resolver um problema
4. **Validação** — testes automáticos ou revisão do professor (configurável)

### Catálogo inicial sugerido

- Lógica básica (condicionais, loops)
- Variáveis e tipos
- Funções
- Arrays e listas
- Mini-projetos (jogo simples, calculadora)

### Modelo de conteúdo

O gestor **não cria conteúdo do zero** — ele seleciona e ordena módulos de um catálogo mantido pelo Super Admin. Isso garante qualidade e simplifica a UX do gestor.

---

## Sandbox

O coração do produto. O aluno escreve e executa código diretamente no browser.

### Características

- **Execução client-side** (WebAssembly) — barato, seguro, sem latência de servidor
- **Autocomplete contextual** — baseado no vocabulário já ensinado na trilha, não no vocabulário completo da linguagem (menos intimidador)
- **Feedback de erro humanizado** — mensagens em linguagem acessível para crianças
- **Blocos visuais** — opcional, configurável pelo gestor por trilha; exibe o código gerado em tempo real como ponte para o modo texto

### Modos de interface (configurável pelo gestor)

```
Modo Blocos → Modo Híbrido (blocos + código lado a lado) → Modo Texto
```

---

## Validação de Desafios

A validação é baseada em **testes de comportamento**, não em comparação de código — o que permite múltiplas soluções válidas.

**Exemplo:** desafio "crie uma função que soma dois números"
- `function soma(a, b) { return a + b }` ✅
- `const soma = (a, b) => a + b` ✅
- Qualquer implementação que passe em: `soma(2,3) === 5`, `soma(-1,1) === 0` ✅

### Modos de validação (configurável pelo gestor por desafio ou trilha)

| Modo | Funcionamento |
|---|---|
| **Automático** | Testes rodam instantaneamente; aluno vê feedback na hora |
| **Automático + Revisão** | Testes passam, mas professor ainda analisa e atribui nota qualitativa |
| **Manual** | Professor recebe a submissão, analisa e retorna correção escrita com nota |

O modo manual é indicado para desafios abertos que avaliam criatividade, legibilidade e comentários no código.

---

## Theming por Tenant

Toda a identidade visual da plataforma é configurável por tenant. As cores do app são definidas por **variáveis CSS**, e cada tenant pode ter seu próprio conjunto de valores.

### Regra de implementação (frontend)

Nenhuma cor pode ser definida como valor fixo no código — todas devem referenciar variáveis CSS (ex: `var(--color-primary)`). Isso é obrigatório em `web` e `app`.

### Quem configura

| Ator | Permissão |
|---|---|
| **Super Admin** | Define o tema padrão da plataforma e pode sobrescrever o tema de qualquer tenant |
| **Gestor do Tenant** | Personaliza as variáveis do seu tenant dentro dos limites permitidos |

### Variáveis mínimas esperadas

- Cor primária, secundária e de destaque
- Cor de fundo e superfície
- Cor de texto principal e secundário
- Cor de sucesso, erro e aviso

---

## Chat IA — Tutor

### Princípio pedagógico

O tutor **não entrega a resposta** — guia o aluno com dicas progressivas. O prompt de sistema deve conter: contexto do desafio atual, histórico do aluno e regra explícita de não fornecer soluções completas.

### Comportamentos esperados

- Aluno pergunta "como faço X?" → IA dá uma dica, não o código
- Aluno travado por muito tempo → IA oferece ajuda proativamente
- Aluno erra 3x o mesmo desafio → IA muda a abordagem da explicação

### Explicação de erro ao falhar um teste *(configurável pelo gestor)*

Quando um teste do desafio falha, o aluno pode pedir explicitamente que o Codi
explique o erro (botão no painel de resultados — não é automático). O contexto
do teste que falhou (descrição, esperado, obtido, mensagem de erro) é enviado
junto da mensagem e incorporado ao prompt de sistema, mas o tutor continua
seguindo a mesma regra de não entregar a solução completa — apenas explica o
que está errado e guia o raciocínio.

**Por que não é automático:** disparar a cada falha tiraria a "luta produtiva"
do aluno (errar faz parte do aprendizado) e consumiria o limite diário de
mensagens em re-execuções rápidas. O aluno decide quando quer ajuda.

**Configuração:** liga/desliga por tenant, controlado pelo Gestor (não pelo
Super Admin — é uma escolha pedagógica, não um limite de custo). Detalhes
técnicos em `agent_docs/banco-de-dados.md` (campo `ai_error_explanation_enabled`
em `tenants.settings`).

---

## Gamificação

Um dos pilares principais do produto. Composta por múltiplas camadas para sustentar o engajamento a longo prazo.

> **As regras de gamificação são configuráveis por tenant.** Todos os valores (XP por nível, bônus de
> primeira tentativa, bônus de streak, milestones) têm padrões de plataforma mas podem ser ajustados
> pelo Super Admin por tenant. Gestores visualizam mas não alteram regras. Detalhes técnicos e fórmulas
> em `agent_docs/gamificacao.md`.

### Progressão visível

- **XP** por desafio completado (bônus por tentativas mínimas, por velocidade, por usar conceitos novos)
- **Nível do aluno** com título temático (ex: "Aprendiz", "Dev Jr", "Hacker")
- Barra de progresso por módulo e por trilha

### Conquistas (badges)

- **Por marco:** "completou primeira trilha", "resolveu sem dicas", "5 dias seguidos"
- **Por estilo:** código mais enxuto que o esperado, ajudou colega *(V2)*
- **Raros:** criam aspiração e senso de conquista especial

### Competição social

- Ranking **por turma** (não global — evita desmotivar iniciantes)
- Desafio da semana com placar temporário
- Ranking pode ser desligado pelo gestor

### Streaks e missões

- Missão diária: "complete 1 desafio hoje"
- Missões semanais com recompensa maior *(V2)*

### Moeda cosmética *(V2)*

- XP convertível em temas do editor, avatares, efeitos visuais
- Nunca afeta o aprendizado — apenas cosmético

---

## Progressão Configurável

O gestor define o modo de progressão por turma ou por trilha:

| Modo | Comportamento |
|---|---|
| **Livre** | Aluno avança sozinho ao completar desafios |
| **Sequencial** | Precisa completar o anterior para desbloquear o próximo |
| **Controlado** | Professor libera módulos manualmente |

Possível combinar: trilha sequencial com opção de o professor "pular" um aluno que já domina o conteúdo.

---

## Área Livre — Garagem de Projetos *(V2)*

Espaço separado das trilhas onde o aluno experimenta sem objetivo fixo. Complementa o aprendizado estruturado com exploração livre.

### Funcionalidades

- Criar, salvar e retomar projetos pessoais
- Publicar projetos para a turma ver (portfólio interno)
- Turma reage com emojis/aplausos (sem nota, sem pressão)

### Integração com gamificação

- Projetos salvos contam como atividade (mantém streak)
- Badges: "Publicou primeiro projeto", "Projeto mais curtido da semana"

### Poder do gestor

- Ligar/desligar área livre por turma
- Ver todos os projetos dos alunos
- Transformar um projeto de aluno em **desafio oficial** para a turma

---

## Desafios Colaborativos *(V2)*

### Par programming

- Gestor ou sistema forma duplas
- Cada aluno vê apenas **sua parte** do problema
- O código só valida quando ambos submetem e as partes funcionam juntas
- Nenhum vê o código do outro até a validação — incentiva comunicação verbal

**Exemplo:** Aluno A escreve `buscaDados()`, Aluno B escreve `processaDados()` — nenhuma parte funciona sozinha.

### Variações

- **Revisão entre pares:** A resolve, B revisa e comenta antes de submeter
- **Desafio de turma:** problema grande dividido em partes, cada aluno pega uma — resultado final é coletivo (ótimo para encerramento de módulo)

### Gamificação do colaborativo

- XP compartilhado entre a dupla
- Badge "Trabalho em Equipe"
- Ranking de duplas separado do individual

---

## Fluxo do Gestor

```
Login (email + senha + slug)
└── Dashboard do Gestor
    ├── Configurar tenant
    │   ├── Theming (cores, logo)
    │   └── Configurações gerais (progressão padrão, validação padrão, blocos visuais)
    ├── Trilhas
    │   ├── Selecionar trilhas do catálogo
    │   └── Definir ordem
    ├── Turmas
    │   ├── Criar turma
    │   ├── Associar alunos
    │   └── Configurar por turma (progressão, validação, trilhas disponíveis)
    └── Relatórios
        └── Progresso por aluno e por turma
```

---

## Fluxo de Onboarding

### Novo tenant (gestor)
1. Super Admin cria o tenant e define o slug
2. Gestor recebe e-mail de convite com link de primeiro acesso
3. Gestor define senha e acessa o dashboard
4. Wizard de setup inicial: theming → selecionar trilhas → criar primeira turma → convidar alunos

### Novo aluno
1. Gestor cria o aluno individualmente ou importa via **CSV**
2. Um modelo padrão de CSV está disponível para download no dashboard do gestor
3. Aluno recebe e-mail com link de primeiro acesso
4. Aluno define senha
5. Tela de boas-vindas com explicação da plataforma e início da primeira trilha

---

## Dashboard do Gestor

### MVP

- Quais trilhas estão disponíveis para o tenant
- Ordem das trilhas
- Criar turmas e associar alunos
- Relatório de progresso (quem completou o quê)

### V2

- Quem está travado em qual desafio (e há quantos dias)
- Top e bottom do ranking
- Comparativo entre turmas
- Alertas: "3 alunos não acessam há 7 dias"
- Transformar projeto de aluno em desafio oficial

---

## Fluxo do Aluno (jornada principal)

```
Login
└── Dashboard
    ├── Trilha atual (progresso visual)
    │   └── Módulo
    │       ├── Conceito (leitura)
    │       ├── Exemplo guiado
    │       └── Desafio
    │           ├── Sandbox (escreve código)
    │           ├── Roda e valida
    │           ├── [Passou] → próximo módulo + XP + badge
    │           └── [Travado] → dica → chat IA
    ├── Garagem de Projetos (V2)
    │   ├── Meus projetos
    │   └── Projetos da turma (publicados)
    └── Perfil / Gamificação
        ├── XP, nível, título
        ├── Badges conquistados
        ├── Ranking da turma
        └── Streak e missões
```

---

## Priorização

### MVP — lançamento

| Área | Funcionalidades |
|---|---|
| **Multi-tenant** | Super Admin + Gestor + Aluno; criação de tenants e turmas |
| **Trilhas** | Catálogo fixo JS, seleção e ordenação pelo gestor, modo sequencial |
| **Sandbox** | Execução JS client-side, autocomplete contextual, erros humanizados |
| **Validação** | Automática por testes de comportamento; modo manual opcional |
| **Gamificação** | XP, níveis, badges, ranking da turma, streak diário |
| **Chat IA** | Tutor com modo dica, contexto do desafio atual |
| **Configurações gestor** | Modo de progressão, modo de validação, blocos visuais on/off |

### V2

| Área | Funcionalidades |
|---|---|
| **Atores** | Papel de Professor |
| **Sandbox** | Área livre / garagem de projetos |
| **Colaboração** | Par programming, revisão entre pares, desafio de turma |
| **Social** | Publicação de projetos, reações da turma |
| **Linguagens** | Python (segunda linguagem) |
| **Dashboard** | Alertas, comparativos, projeto de aluno → desafio oficial |
| **Gamificação** | Missões semanais, moeda cosmética, badges raros |
| **Aulas gravadas** | Aulas em vídeo por módulo: link externo (YouTube, Vimeo, etc.) ou upload de arquivo; configurável pelo gestor |

---

## Considerações Importantes

### LGPD / Privacidade de menores
Crianças menores de 12 anos exigem consentimento parental explícito. O modelo B2B (escola contrata) delega parte dessa responsabilidade para a instituição, mas os termos de uso precisam ser claros.

### Custo de IA e Throttling
Chat IA por aluno escala o custo. Para portfólio/uso baixo: desprezível. Para produção: throttling obrigatório (ex: limite de mensagens por desafio ou por sessão) e uso de modelo eficiente (Claude Haiku ou equivalente). O limite de mensagens deve ser configurável pelo Super Admin por plano de tenant.

### Moderação de conteúdo
Crianças testam os limites do chat. O system prompt (`buildSystemPrompt` em `apps/api/.../ai-tutor.service.ts`) tem guardrails explícitos contra prompt injection — código do aluno e contexto de teste falho são tratados como dado, nunca como instrução —, contra extração do próprio prompt, e contra fuga de tema/conteúdo impróprio para a idade (recusa com redirecionamento ao desafio). Filtro de output (revisão automática da resposta da IA antes de exibir ao aluno) ainda não foi implementado — depende de validação real de custo/latência antes de entrar no MVP.

### Engajamento
Game design é tão crítico quanto o conteúdo técnico. A gamificação precisa de progressão de dificuldade cuidadosa — fácil demais desmotiva, difícil demais abandona.

### Notificações

**MVP:**
- E-mails críticos: convite de primeiro acesso e recuperação de senha
- Notificações in-app: eventos de gamificação (novo badge, subiu de nível, streak atingido)

**V2:**
- E-mails de engajamento: aluno inativo há X dias (para gestor), resumo semanal de progresso da turma

### Recuperação de senha
Fluxo padrão: usuário acessa `app.com/:slug/login` → clica em "esqueci minha senha" → informa e-mail → recebe link com token de uso único → define nova senha. O token expira em 1 hora.
