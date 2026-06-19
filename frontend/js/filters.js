// === Filters — filtrar, ordenar e debounce ===

const Filters = {
  _debounceTimer: null,

  debounce(callback) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(callback, CONFIG.DEBOUNCE_MS);
  },

  apply(items, filters, sortBy, sortDir) {
    let result = [...items];

    if (filters.type) {
      result = result.filter((i) => i.type === filters.type);
    }
    if (filters.urgency) {
      result = result.filter((i) => i.urgency === filters.urgency);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.actionRequired && i.actionRequired.toLowerCase().includes(q)) ||
          (i.responsible && i.responsible.toLowerCase().includes(q))
      );
    }

    const dir = sortDir === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'discoveryDate': {
          const da = a.discoveryDate || '';
          const db = b.discoveryDate || '';
          cmp = da.localeCompare(db);
          break;
        }
        case 'urgency':
          cmp = (URGENCY_WEIGHT[a.urgency] || 0) - (URGENCY_WEIGHT[b.urgency] || 0);
          break;
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '', 'pt-BR');
          break;
        default:
          cmp = 0;
      }
      return cmp * dir;
    });

    return result;
  },

  hasActiveFilters(filters) {
    return !!(filters.type || filters.urgency || (filters.search && filters.search.trim()));
  },
};
