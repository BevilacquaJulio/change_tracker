// === Model — CRUD, validação e histórico de status ===

const Model = {
  normalizeType(type) {
    if (TYPES.includes(type)) return type;
    if (TYPE_ALIASES[type]) return TYPE_ALIASES[type];
    return DEFAULT_ITEM.type;
  },

  normalizeEvidence(evidence) {
    if (!evidence) return [];
    const withToken = (src) => {
      const value = (src || '').trim();
      if (!value) return '';
      // URLs servidas pelo backend precisam do token JWT para o <img> carregar
      if (value.includes('/attachments/') && typeof Auth !== 'undefined') {
        return Auth.withToken(value);
      }
      return value;
    };
    if (Array.isArray(evidence)) {
      return evidence.map((e) => (typeof e === 'string' ? withToken(e) : '')).filter(Boolean);
    }
    if (typeof evidence === 'string' && evidence.trim()) return [withToken(evidence)];
    return [];
  },

  isImageEvidence(src) {
    if (!src || typeof src !== 'string') return false;
    return src.startsWith('data:image/') || Model.isImageUrl(src);
  },

  normalizeItem(item) {
    if (!item || typeof item !== 'object') return item;
    return {
      ...item,
      type: this.normalizeType(item.type),
      evidence: this.normalizeEvidence(item.evidence),
    };
  },

  createItem(overrides = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const item = {
      id: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...DEFAULT_ITEM,
      discoveryDate: today,
      statusHistory: [],
      completedAt: null,
      ...overrides,
    };
    item.type = this.normalizeType(item.type);
    item.evidence = this.normalizeEvidence(item.evidence);
    item.statusHistory.push({
      from: null,
      to: item.status,
      at: item.createdAt,
    });
    return item;
  },

  validate(item) {
    const errors = {};
    if (!item.title || !item.title.trim()) {
      errors.title = 'Título é obrigatório.';
    }
    if (!item.urgency || !URGENCY_WEIGHT[item.urgency]) {
      errors.urgency = 'Selecione um nível de urgência.';
    }
    return errors;
  },

  updateStatus(item, newStatus) {
    if (item.status === newStatus) return item;
    const prev = item.status;
    item.status = newStatus;
    if (!item.statusHistory) item.statusHistory = [];
    item.statusHistory.push({
      from: prev,
      to: newStatus,
      at: new Date().toISOString(),
    });
    if (newStatus === 'Concluído') {
      item.completedAt = new Date().toISOString();
    } else if (prev === 'Concluído') {
      item.completedAt = null;
    }
    return item;
  },

  formatDate(isoOrDate) {
    if (!isoOrDate) return '—';
    const d = new Date(isoOrDate.includes('T') ? isoOrDate : isoOrDate + 'T12:00:00');
    if (isNaN(d.getTime())) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  },

  formatDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  isImageUrl(url) {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (url.includes('/attachments/')) return true;
    return /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('imgur') || url.includes('screenshot');
  },

  truncate(str, max = 60) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
  },

  getDashboardCounts(items) {
    return {
      total: items.length,
      critical: items.filter((i) => i.urgency === 'Crítica').length,
      high: items.filter((i) => i.urgency === 'Alta').length,
      pending: items.filter((i) => PENDING_STATUSES.includes(i.status)).length,
      inProgress: items.filter((i) => IN_PROGRESS_STATUSES.includes(i.status)).length,
      completed: items.filter((i) => i.status === 'Concluído').length,
    };
  },
};
