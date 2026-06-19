// === Toast — notificações do design system ===

const Toast = {
  _container: null,

  init() {
    this._container = document.getElementById('toast-container');
  },

  show(message, type = 'success', subtitle = '') {
    if (!this._container) this.init();
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      info: 'info',
      warn: 'alert-triangle',
    };
    const subHtml = subtitle ? `<div class="toast__sub">${UIList.escapeHtml(subtitle)}</div>` : '';
    el.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}"></i>
      <div class="toast__content">
        <div class="toast__text">${UIList.escapeHtml(message)}</div>
        ${subHtml}
      </div>
    `;
    this._container.appendChild(el);
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [el] });

    requestAnimationFrame(() => el.classList.add('toast--visible'));

    setTimeout(() => {
      el.classList.remove('toast--visible');
      setTimeout(() => el.remove(), 320);
    }, CONFIG.TOAST_DURATION);
  },
};
