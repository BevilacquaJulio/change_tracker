// === UI Detail — visualização do item (layout alinhado ao formulário de criação) ===

const UIDetail = {
  _overlay: null,
  _headingEl: null,

  init() {
    this._overlay = document.getElementById('detail-overlay');
    this._headingEl = document.getElementById('detail-heading');
    const close = () => this.close();
    document.getElementById('detail-close').addEventListener('click', close);
    document.getElementById('detail-close-footer').addEventListener('click', close);
    document.getElementById('detail-body').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="open-url"]');
      if (btn?.dataset.url) window.open(btn.dataset.url, '_blank', 'noopener,noreferrer');
    });
    document.getElementById('detail-edit').addEventListener('click', () => {
      const id = AppState.detailId;
      this.close();
      if (id) UIModal.openEdit(id);
    });
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
  },

  _value(text, emptyLabel = '—') {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return `<span class="detail-view__value detail-view__value--muted">${emptyLabel}</span>`;
    }
    return `<div class="detail-view__value">${UIList.escapeHtml(trimmed)}</div>`;
  },

  _urgencyReadonly(selected) {
    return `<div class="urgency-picker urgency-picker--readonly" aria-label="Urgência">
      ${URGENCY_PICKER.map(
        (u) => `
        <div class="urgency-picker__option${u.value === selected ? ' is-selected' : ''}" data-urgency="${u.value}">
          <span class="urgency-ring ${u.ring}" aria-hidden="true"></span>
          <span class="urgency-picker__label">${u.value}</span>
        </div>`
      ).join('')}
    </div>`;
  },

  _evidenceBlock(item) {
    const html = UIEvidence.renderBlock(item, { openAction: 'open-lightbox' });
    return html || this._value('', 'Nenhuma evidência anexada');
  },

  _urlBlock(item) {
    if (!item.url?.trim()) {
      return this._value('', 'Nenhuma URL informada');
    }
    return `<div class="detail-view__value detail-view__value--url">
      <span class="detail-view__url-text">${UIList.escapeHtml(item.url)}</span>
      <button type="button" class="btn btn--ghost btn--icon btn--sm" data-action="open-url" data-url="${UIList.escapeHtml(item.url)}" title="Abrir link">
        <i data-lucide="external-link"></i>
      </button>
    </div>`;
  },

  open(id) {
    const item = AppState.getItemById(id);
    if (!item) return;
    AppState.detailId = id;

    const body = document.getElementById('detail-body');
    this._headingEl.textContent = item.title || 'Detalhes do item';

    body.innerHTML = `
      <article class="detail-view">
        <div class="detail-view__badges">
          ${UIList.badgeUrgency(item.urgency)}
          ${UIList.badgeType(item.type)}
        </div>
        <h3 class="detail-view__title">${UIList.escapeHtml(item.title)}</h3>

        <div class="detail-view__grid">
          <div class="detail-view__field">
            <span class="form-label">Tipo</span>
            ${this._value(item.type)}
          </div>
          <div class="detail-view__field">
            <span class="form-label">Data da descoberta</span>
            ${this._value(Model.formatDate(item.discoveryDate))}
          </div>
        </div>

        <div class="detail-view__field">
          <span class="form-label">URL afetada</span>
          ${this._urlBlock(item)}
        </div>

        <div class="detail-view__field">
          <span class="form-label">O que foi encontrado</span>
          ${this._value(item.description, 'Não informado')}
        </div>

        <div class="detail-view__field">
          <span class="form-label">O que deve ser feito</span>
          ${this._value(item.actionRequired, 'Não informado')}
        </div>

        <div class="detail-view__field">
          <span class="form-label">Urgência</span>
          ${item.urgency ? this._urgencyReadonly(item.urgency) : this._value('', 'Não definida')}
        </div>

        <div class="detail-view__field">
          <span class="form-label">Evidência / Screenshot</span>
          ${this._evidenceBlock(item)}
        </div>

        <p class="detail-view__meta">Criado em ${Model.formatDateTime(item.createdAt)}${item.completedAt ? ` · Concluído em ${Model.formatDateTime(item.completedAt)}` : ''}</p>
      </article>
    `;

    const host = body.querySelector('.evidence-carousel-host');
    if (host) {
      UIEvidence.bindCarousel(host, {
        onLightbox: (images, i) => UILightbox.openGallery(images, i),
      });
    }

    this._overlay.classList.add('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    body.scrollTop = 0;
    requestAnimationFrame(() => {
      body.scrollTop = 0;
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [body] });
  },

  close() {
    const body = document.getElementById('detail-body');
    if (body) body.scrollTop = 0;
    this._overlay.classList.remove('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'true');
    if (
      !document.getElementById('modal-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('lightbox-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('confirm-overlay').classList.contains('modal-overlay--open')
    ) {
      document.body.classList.remove('modal-open');
    }
    AppState.detailId = null;
  },
};
