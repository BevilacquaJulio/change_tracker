// === UI Confirm — modal de confirmação reutilizável (sempre, nunca alert/confirm nativo) ===

const UIConfirm = {
  _overlay: null,
  _resolve: null,
  _closing: false,

  init() {
    this._overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-cancel').addEventListener('click', () => this._finish(false));
    document.getElementById('confirm-ok').addEventListener('click', () => this._finish(true));
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this._finish(false);
    });
  },

  /**
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} opts.message
   * @param {string} [opts.confirmLabel]
   * @param {string} [opts.cancelLabel]
   * @param {'primary'|'danger'|'success'|'warn'} [opts.variant]
   * @param {string} [opts.icon] — nome do ícone Lucide
   * @returns {Promise<boolean>}
   */
  open(opts) {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._closing = false;

      const {
        title = 'Confirmar ação',
        message = '',
        confirmLabel = 'Confirmar',
        cancelLabel = 'Cancelar',
        variant = 'primary',
        icon = 'help-circle',
      } = opts;

      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').innerHTML = message;
      document.getElementById('confirm-cancel').textContent = cancelLabel;

      const okBtn = document.getElementById('confirm-ok');
      const iconMarkup = typeof UIList !== 'undefined' ? UIList.iconHtml(icon) : `<i data-lucide="${icon}"></i>`;
      okBtn.innerHTML = `${iconMarkup} ${confirmLabel}`;
      okBtn.className = 'btn btn--primary';
      if (variant === 'danger') okBtn.classList.add('btn--danger-solid');
      if (variant === 'success') okBtn.classList.add('btn--success-solid');
      if (variant === 'warn') okBtn.classList.add('btn--warn-solid');

      const iconWrap = document.getElementById('confirm-icon-wrap');
      iconWrap.className = `confirm-icon confirm-icon--${variant}`;
      iconWrap.innerHTML = typeof UIList !== 'undefined' ? UIList.iconHtml(icon) : `<i data-lucide="${icon}"></i>`;

      this._overlay.classList.remove('modal-overlay--closing');
      this._overlay.classList.add('modal-overlay--open');
      this._overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      const confirmBody = this._overlay.querySelector('.modal__body');
      if (confirmBody) confirmBody.scrollTop = 0;

      if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [this._overlay] });
      requestAnimationFrame(() => {
        if (confirmBody) confirmBody.scrollTop = 0;
        document.getElementById('confirm-cancel').focus({ preventScroll: true });
      });
    });
  },

  _finish(confirmed) {
    if (this._closing) return;
    this._closing = true;
    this._overlay.classList.add('modal-overlay--closing');
    this._overlay.classList.remove('modal-overlay--open');

    const done = () => {
      this._overlay.classList.remove('modal-overlay--closing');
      this._overlay.setAttribute('aria-hidden', 'true');
      
      // Verificar se algum modal ainda está aberto, antes de remover a classe modal-open
      const modalOverlay = document.getElementById('modal-overlay');
      const detailOverlay = document.getElementById('detail-overlay');
      const lightboxOverlay = document.getElementById('lightbox-overlay');
      
      const anyModalOpen = 
        (modalOverlay && modalOverlay.classList.contains('modal-overlay--open')) ||
        (detailOverlay && detailOverlay.classList.contains('modal-overlay--open')) ||
        (lightboxOverlay && lightboxOverlay.classList.contains('modal-overlay--open'));
      
      if (!anyModalOpen) {
        document.body.classList.remove('modal-open');
      }
      
      const resolve = this._resolve;
      this._resolve = null;
      if (resolve) resolve(confirmed);
    };

    setTimeout(done, 260);
  },
};
