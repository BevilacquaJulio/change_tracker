// === UI Settings — configurações do usuário ===

const UISettings = {
  _overlay: null,

  init() {
    this._overlay = document.getElementById('settings-overlay');
    if (!this._overlay) return;

    document.getElementById('btn-settings')?.addEventListener('click', () => this.open());
    document.getElementById('settings-close')?.addEventListener('click', () => this.close());
    document.getElementById('settings-cancel')?.addEventListener('click', () => this.close());

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay.classList.contains('modal-overlay--open')) {
        this.close();
      }
    });

    document.getElementById('settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.close();
    });
  },

  open() {
    const errorEl = document.getElementById('settings-error');
    if (errorEl) errorEl.textContent = '';

    this._overlay.classList.add('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  close() {
    this._overlay.classList.remove('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'true');
    if (
      !document.getElementById('modal-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('detail-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('confirm-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('project-picker-overlay')?.classList.contains('modal-overlay--open')
    ) {
      document.body.style.overflow = '';
    }
  },
};
