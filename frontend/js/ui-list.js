// === UI List — cards, badges e ações rápidas (design system) ===

const UIList = {
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  badgeUrgency(urgency) {
    if (!urgency) return '';
    const cls = URGENCY_BADGE[urgency] || 'badge-gray';
    return `<span class="badge ${cls}"><span class="dot"></span>${this.escapeHtml(urgency)}</span>`;
  },

  badgeType(type) {
    const normalized = Model.normalizeType(type);
    const cls = TYPE_BADGE[normalized] || 'badge-gray';
    return `<span class="badge ${cls}">${this.escapeHtml(normalized)}</span>`;
  },

  statusChip(status) {
    const cls = STATUS_CHIP[status] || 'chip-backlog';
    return `<span class="status-chip ${cls}"><span class="dot"></span>${this.escapeHtml(status)}</span>`;
  },

  renderQuickActions(item) {
    const actions = QUICK_ACTIONS[item.status] || [];
    if (!actions.length) return '';
    return actions
      .map((a) => {
        const btnCls = a.btnClass ? ` ${a.btnClass}` : '';
        const iconHtml = UIList.iconHtml(a.icon);
        return `<button type="button" class="btn btn--sm btn--ghost${btnCls}" data-action="quick-status" data-id="${item.id}" data-target="${this.escapeHtml(a.target)}" data-label="${this.escapeHtml(a.label)}" data-confirm-variant="${a.confirmVariant || 'primary'}" title="${this.escapeHtml(a.label)}">
          ${iconHtml} ${this.escapeHtml(a.label)}
        </button>`;
      })
      .join('');
  },

  iconHtml(name) {
    if (name === 'check-check') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>`;
    }
    return `<i data-lucide="${this.escapeHtml(name)}"></i>`;
  },

  archivedTag(item) {
    if (!item.archivedAt) return '';
    return `<span class="badge badge-gray"><i data-lucide="archive"></i> Arquivado</span>`;
  },

  renderArchiveAction(item) {
    if (item.archivedAt) {
      return `<button type="button" class="btn btn--sm btn--ghost" data-action="reopen" data-id="${item.id}" title="Desarquivar">
        <i data-lucide="archive-restore"></i> Desarquivar
      </button>`;
    }
    return `<button type="button" class="btn btn--sm btn--ghost" data-action="archive" data-id="${item.id}" title="Arquivar">
      <i data-lucide="archive"></i> Arquivar
    </button>`;
  },

  renderCard(item) {
    const urlDisplay = item.url ? Model.truncate(item.url, 55) : '';
    const snippet = item.description ? Model.truncate(item.description, 120) : '';
    const urgencyAttr = item.urgency
      ? ` data-urgency="${this.escapeHtml(item.urgency)}"`
      : '';
    const archivedClass = item.archivedAt ? ' change-card--archived' : '';

    return `
      <article class="change-card${archivedClass}"${urgencyAttr} data-id="${item.id}">
        <div class="card-header">
          <div>
            <div class="card-badges">
              ${this.badgeUrgency(item.urgency)}
              ${this.badgeType(item.type)}
              ${this.archivedTag(item)}
            </div>
            <h3 class="card-title">${this.escapeHtml(item.title)}</h3>
            ${urlDisplay ? `<div class="card-url"><i data-lucide="link-2"></i> ${this.escapeHtml(urlDisplay)}</div>` : ''}
            ${snippet ? `<p class="change-card__snippet">${this.escapeHtml(snippet)}</p>` : ''}
          </div>
        </div>
        <div class="card-meta">
          <span class="meta-item"><i data-lucide="calendar"></i> Descoberto ${Model.formatDate(item.discoveryDate)}</span>
        </div>
        <div class="card-actions">
          ${item.archivedAt ? '' : this.renderQuickActions(item)}
          <button type="button" class="btn btn--sm btn--ghost" data-action="open-detail" data-id="${item.id}" title="Visualizar">
            <i data-lucide="eye"></i> Visualizar
          </button>
          <button type="button" class="btn btn--sm btn--ghost" data-action="edit" data-id="${item.id}" title="Editar">
            <i data-lucide="pencil"></i> Editar
          </button>
          ${this.renderArchiveAction(item)}
          ${urlDisplay ? `<button type="button" class="btn btn--icon btn--ghost" data-action="open-url" data-url="${this.escapeHtml(item.url)}" title="Abrir URL"><i data-lucide="external-link"></i></button>` : ''}
          <button type="button" class="btn btn--icon btn--ghost" data-action="delete" data-id="${item.id}" title="Excluir">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </article>
    `;
  },

  render(container, items) {
    if (!items.length) {
      const hasFilters = Filters.hasActiveFilters(AppState.filters);
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox" class="empty-icon"></i>
          <p class="empty-title">${hasFilters ? 'Nenhum item corresponde aos filtros' : 'Nenhum item de mudança ainda'}</p>
          <span class="empty-sub">${hasFilters ? 'Ajuste os filtros ou limpe a busca' : 'Adicione o primeiro item para começar a rastrear'}</span>
          ${!hasFilters ? '<button type="button" class="btn btn--primary btn--sm" data-action="new-item"></i> Criar primeiro item</button>' : ''}
        </div>
      `;
      return;
    }
    container.innerHTML = items.map((i) => this.renderCard(i)).join('');
  },
};
