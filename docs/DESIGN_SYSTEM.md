# Change Tracker — Design System

Documentação viva do padrão visual e de interação. Implementação em `frontend/css/` e componentes em `frontend/index.html`.

---

## Princípios

1. **Modo escuro** com fundo `#0f1117` e superfícies em camadas (`surface` → `raised` → `hover`).
2. **Azul** como cor de ação primária (`#3b82f6`); semânticas para urgência e status.
3. **Inter** (400/500/600) — leitura prolongada confortável.
4. **Confirmação sempre** — nenhum `alert()` ou `confirm()` nativo; usar `UIConfirm`.
5. **Movimento suave** — transições 150–350ms; respeitar `prefers-reduced-motion`.

---

## Tokens (`css/variables.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-base` | `#0f1117` | Fundo da página |
| `--bg-surface` | `#171c27` | Cards, navbar, filtros |
| `--bg-raised` | `#1e2535` | Toast, painéis elevados |
| `--bg-input` | `#141824` | Campos de formulário |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Bordas padrão |
| `--blue-500` | `#3b82f6` | Botão primário |
| `--text-primary` | `#e8eaf0` | Texto principal |
| `--text-secondary` | `#8b92a5` | Labels, metadados |
| `--text-muted` | `#545c70` | Hints, timestamps |

Raio: `--radius-sm` 6px · `--radius-md` 8px · `--radius-lg` 12px · `--radius-xl` 16px.

---

## Tipografia

| Classe | Tamanho / peso | Uso no app |
|--------|----------------|------------|
| `.type-h1` | 24px / 600 | — |
| `.type-h2` | 18px / 600 | Título do modal detalhe |
| `.type-h3` | 15px / 500 | Títulos internos |
| `.type-body` | 14px | Corpo |
| `.type-small` | 12px | Metadados de card |
| `.type-micro` | 11px | ID, timestamps |
| `.type-blue` | 13px azul | URLs |

---

## Componentes

### Navbar (`.header` + `.header__inner`)

Barra arredondada (`--radius-xl`), 56px de altura, sticky com margem superior. Marca: **Change Tracker** (título único, sem subtítulo de domínio).

### Botões (`.btn`)

| Variante | Classe | Altura |
|----------|--------|--------|
| Primário | `.btn--primary` | 36px |
| Secundário | `.btn--ghost` | 36px |
| Compacto | `.btn--sm` | 28px |
| Ícone | `.btn--icon` | 32×32px |

**Microinteração:** ripple via `--ripple-x/y`, classe `.is-pressed`, `:active { scale(0.97) }` — ver `css/animations.css` e `App._bindButtonEffects()`.

### Métricas (`.metric-card`)

Grid 6 colunas no desktop. Valores coloridos: `.metric-value--red`, `--orange`, `--green`, `--blue`.

### Badges de urgência

| Urgência | Classe |
|----------|--------|
| Crítica | `.badge-red` + `.dot` |
| Alta | `.badge-orange` |
| Média | `.badge-yellow` |
| Baixa | `.badge-blue` |

### Badges de tipo

Mapeamento em `TYPE_BADGE` (`js/config.js`): Implementação → `badge-blue`, Correção → `badge-purple`, Melhoria → `badge-green`.

### Status chips

| Status | Classe |
|--------|--------|
| Backlog | `.chip-backlog` |
| Em análise | `.chip-analysis` |
| Em desenvolvimento | `.chip-dev` |
| Aguardando validação | `.chip-validation` |
| Concluído | `.chip-done` |
| Cancelado | `.chip-cancelled` |

### Cards de mudança (`.change-card`)

- Borda esquerda vermelha quando `.critical` (urgência Crítica).
- Layout: badges + título + URL + snippet; chip de status à direita; meta (data, esforço, responsável); ações rápidas.
- Entrada: animação `cardEnter` com stagger nos primeiros itens.

### Filtros (`.filters` / `.filter-bar`)

Inputs `.form-input` / `.form-select`. Contador: `.filter-count`.

### Modais (`.modal-overlay` + `.modal`)

- Overlay com `backdrop-filter: blur(4px)`.
- Painel: escala 0.96 → 1 e fade (`animations.css`).
- Fechar com overlay/Escape no formulário → confirma se houver alterações não salvas.

### Modal de confirmação (`UIConfirm`)

Sempre para:

- Exclusão de item
- Alteração rápida de status
- Importação JSON (substituição)
- Fechar formulário com dados alterados

Variantes do ícone: `--primary`, `--danger`, `--success`, `--warn`.

### Toast (`.toast`)

Tipos: `success`, `info`, `error`, `warn`. Estrutura: ícone + `.toast__text` + `.toast__sub` opcional. Entrada pela direita.

### Timeline (`.timeline`)

Histórico de status no detalhe: `.tl-dot-blue|green|gray|red` + linha vertical.

---

## Animações (`css/animations.css`)

| Elemento | Comportamento | Duração |
|----------|---------------|---------|
| Botões | Ripple + scale no active | 150ms |
| Modal | Fade overlay + scale painel | 250ms |
| Cards | Fade + translateY na lista | 350ms stagger |
| Toast | Slide da direita | 250ms |
| Métricas | Hover translateY -2px | 150ms |

`@media (prefers-reduced-motion: reduce)` desativa animações longas.

---

## Arquivos do projeto

```
css/
  variables.css    ← tokens
  base.css         ← reset e layout
  components.css   ← componentes DS
  animations.css   ← transições e keyframes
  responsive.css   ← breakpoints
js/
  ui-confirm.js    ← modal de confirmação universal
  ui-list.js       ← badges/chips do DS
  ...
```

---

## Changelog do design system

### 2026-05-29 — Modal simplificado + urgência visual + screenshot

- Formulário do modal reduzido a: tipo, data, título, URL, descrição, ação, urgência e evidência.
- Urgência com seletor de anéis vazados coloridos (verde → amarelo → laranja → vermelho), ordem Baixa → Crítica.
- Evidência com upload de imagem (arrastar/soltar ou arquivo), preview e armazenamento em base64 (máx. 2 MB).
- Campos removidos do modal (mantidos no modelo/detalhe): esforço, responsável, status, observações — preenchidos com defaults na criação.
- Novo `css/form-modal.css`.

### 2026-05-29 — Dropdowns via portal (correção de posicionamento)

- Filtros do dashboard agora são convertidos corretamente (antes o seletor buscava um `id="filters"` inexistente; passou a usar `select.form-select` em todo o documento).
- Menu dos dropdowns agora é "portado" para o `<body>` ao abrir, escapando do `transform` do modal animado — corrige o menu aparecendo fora do lugar dentro do modal de criação.
- Estado de abertura passou para a própria `.custom-select__menu.is-open` (em vez de depender do wrapper), viabilizando o portal.
- Reposicionamento ancorado ao gatilho em scroll/resize (inclui o scroll interno do modal).

### 2026-05-29 — Dropdowns ancorados, marca azul, sem emojis

- Marca **Change Tracker** agora em azul (`--blue-400`) com ícone `git-branch`; subtítulo de domínio removido.
- Dropdowns customizados reposicionados com `position: fixed` ancorado ao gatilho (idêntico em filtros e modal), com reposicionamento em scroll/resize — corrige menus aparecendo fora do lugar dentro do modal.
- Marcador de opção selecionada trocado do caractere `✓` por ícone Lucide `check`.
- Interface sem emojis: todos os indicadores usam ícones Lucide.

### 2026-05-29 — Dropdowns glass, scrollbar temática, modal limpo

- Removida linha de metadados (ID / data de criação) do topo do formulário modal.
- Selects substituídos por **custom dropdown** (`UICustomSelect`): painel com `backdrop-filter`, fundo semi-transparente, animação de abertura, seta rotativa.
- Scrollbars globais e do modal alinhadas à paleta escura (`css/scrollbars.css`); `color-scheme: dark` no `html`.
- Novos arquivos: `css/custom-select.css`, `js/ui-custom-select.js`.

### 2026-05-29 — Alinhamento completo ao DS + motion

- Paleta atualizada de azul marinho (`#1E3A5F`) para o DS escuro neutro (`#0f1117`).
- Navbar, métricas, badges, chips, cards, filtros e formulários seguem os tokens em `css/variables.css` e `css/components.css`.
- Novo `css/animations.css`: modais, cards, toasts, botões e `prefers-reduced-motion`.
- Novo `js/ui-confirm.js`: substitui **todos** os diálogos nativos.
- Confirmação obrigatória: exclusão, status rápido, importação, descarte de formulário.
- Ripple nos cliques de `.btn` via `App._bindButtonEffects()`.
- Timeline visual no histórico de status (detalhe).
- Toasts com subtítulo (padrão do DS).
- Fonte Inter via Google Fonts (mesma do preview do DS).
- Documentação inicial neste arquivo.

---

## Como estender

Ao adicionar componentes ou alterar tokens:

1. Atualizar tokens em `css/variables.css`.
2. Implementar estilos em `css/components.css` / `css/animations.css`.
3. Registrar nesta seção **Changelog** com data e bullets objetivos.
