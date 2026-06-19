// === Config — enums, labels, cores e ordens ===

const CONFIG = {
  STORAGE_VERSION: 1,
  DEBOUNCE_MS: 300,
  TOAST_DURATION: 3000,
  APP_NAME: 'Change Tracker',
  /** A API é servida na mesma origem do frontend (caminhos absolutos). */
  API_BASE: '',
};

const TYPES = ['Implementação', 'Correção', 'Melhoria'];

/** Sinônimos de tipo aceitos na normalização e importação JSON */
const TYPE_ALIASES = {
  Implantação: 'Implementação',
  Atenção: 'Melhoria',
  Segurança: 'Correção',
  Performance: 'Melhoria',
  Conteúdo: 'Melhoria',
  Outro: 'Correção',
};

const URGENCIES = ['Crítica', 'Alta', 'Média', 'Baixa'];

/** Tokens visuais de urgência — fonte única para picker, badges e filtros */
const URGENCY_THEME = {
  Baixa: { badge: 'badge-green', ring: 'urgency-ring--baixa' },
  Média: { badge: 'badge-yellow', ring: 'urgency-ring--media' },
  Alta: { badge: 'badge-orange', ring: 'urgency-ring--alta' },
  Crítica: { badge: 'badge-red', ring: 'urgency-ring--critica' },
};

/** Seletor visual de urgência (modal) — do menor ao maior grau */
const URGENCY_PICKER = [
  { value: 'Baixa', ring: URGENCY_THEME.Baixa.ring },
  { value: 'Média', ring: URGENCY_THEME.Média.ring },
  { value: 'Alta', ring: URGENCY_THEME.Alta.ring },
  { value: 'Crítica', ring: URGENCY_THEME.Crítica.ring },
];

/** Ordem do filtro de urgência — igual ao picker */
const URGENCY_FILTER_ORDER = URGENCY_PICKER.map((u) => u.value);

const EVIDENCE_MAX_BYTES = 2 * 1024 * 1024;
const EVIDENCE_MAX_FILES = 10;

const EFFORTS = [
  'Rápido (<1h)',
  'Médio (1–4h)',
  'Alto (4–8h)',
  'Complexo (>8h)',
];

const STATUSES = [
  'Backlog',
  'Em análise',
  'Em desenvolvimento',
  'Aguardando validação',
  'Concluído',
  'Cancelado',
];

/** Classes de badge — derivadas de URGENCY_THEME */
const URGENCY_BADGE = Object.fromEntries(
  Object.entries(URGENCY_THEME).map(([key, theme]) => [key, theme.badge])
);

const TYPE_BADGE = {
  Implementação: 'badge-blue',
  Correção: 'badge-purple',
  Melhoria: 'badge-green',
};

const STATUS_CHIP = {
  Backlog: 'chip-backlog',
  'Em análise': 'chip-analysis',
  'Em desenvolvimento': 'chip-dev',
  'Aguardando validação': 'chip-validation',
  Concluído: 'chip-done',
  Cancelado: 'chip-cancelled',
};

/** Estilo dos botões de ação rápida */
const QUICK_ACTION_BTN = {
  'Em análise': 'btn-action-purple',
  'Em desenvolvimento': 'btn-action-blue',
  'Aguardando validação': 'btn-action-yellow',
  Concluído: 'btn-action-green',
  Cancelado: 'btn-action-purple',
  Backlog: 'btn-action-blue',
};

const URGENCY_WEIGHT = { Crítica: 4, Alta: 3, Média: 2, Baixa: 1 };
const EFFORT_WEIGHT = {
  'Rápido (<1h)': 1,
  'Médio (1–4h)': 2,
  'Alto (4–8h)': 3,
  'Complexo (>8h)': 4,
};

const PENDING_STATUSES = ['Backlog', 'Em análise'];
const IN_PROGRESS_STATUSES = ['Em desenvolvimento', 'Aguardando validação'];

/** Ações rápidas por status atual */
const QUICK_ACTIONS = {
  Backlog: [{ label: 'Marcar como concluído', target: 'Concluído', icon: 'check-check', btnClass: 'btn-action-green', confirmVariant: 'success' }],
  'Em análise': [
    { label: 'Desenvolver', target: 'Em desenvolvimento', icon: 'code', btnClass: 'btn-action-blue', confirmVariant: 'primary' },
    { label: 'Cancelar', target: 'Cancelado', icon: 'x-circle', btnClass: '', confirmVariant: 'danger' },
  ],
  'Em desenvolvimento': [
    { label: 'Enviar para validação', target: 'Aguardando validação', icon: 'send', btnClass: 'btn-action-yellow', confirmVariant: 'primary' },
    { label: 'Cancelar', target: 'Cancelado', icon: 'x-circle', btnClass: '', confirmVariant: 'danger' },
  ],
  'Aguardando validação': [
    { label: 'Concluir', target: 'Concluído', icon: 'check-circle', btnClass: 'btn-action-green', confirmVariant: 'success' },
    { label: 'Cancelar', target: 'Cancelado', icon: 'x-circle', btnClass: '', confirmVariant: 'danger' },
  ],
  Concluído: [{ label: 'Reabrir', target: 'Backlog', icon: 'rotate-ccw', btnClass: '', confirmVariant: 'warn' }],
  Cancelado: [{ label: 'Reabrir', target: 'Backlog', icon: 'rotate-ccw', btnClass: '', confirmVariant: 'warn' }],
};

const DEFAULT_ITEM = {
  type: 'Correção',
  url: '',
  discoveryDate: '',
  title: '',
  description: '',
  actionRequired: '',
  urgency: 'Média',
  effort: 'Médio (1–4h)',
  responsible: '',
  notes: '',
  evidence: [],
  status: 'Backlog',
};
