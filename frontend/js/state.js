// === State — estado global da aplicação ===

const AppState = {
  items: [],
  summary: null,
  filters: {
    type: '',
    urgency: '',
    search: '',
  },
  sortBy: 'discoveryDate',
  sortDir: 'desc',
  editingId: null,
  detailId: null,
  confirmDeleteId: null,

  setItems(items) {
    this.items = (items || []).map((item) => Model.normalizeItem(item));
  },

  getItemById(id) {
    return this.items.find((i) => i.id === id);
  },

  replaceItem(updated) {
    const normalized = Model.normalizeItem(updated);
    const index = this.items.findIndex((i) => i.id === normalized.id);
    if (index >= 0) {
      this.items[index] = normalized;
    } else {
      this.items.unshift(normalized);
    }
    return normalized;
  },

  removeItem(id) {
    this.items = this.items.filter((i) => i.id !== id);
  },
};
