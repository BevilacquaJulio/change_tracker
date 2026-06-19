// === UI Project Picker — selecionar projeto ativo ===

const UIProjectPicker = {
  _overlay: null,
  _projects: [],

  init() {
    this._overlay = document.getElementById('project-picker-overlay');
    if (!this._overlay) return;

    document.getElementById('btn-project-picker')?.addEventListener('click', () => this.open());
    document.getElementById('project-picker-close')?.addEventListener('click', () => this.close());
    document.getElementById('project-picker-cancel')?.addEventListener('click', () => this.close());

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay.classList.contains('modal-overlay--open')) {
        this.close();
      }
    });

    this._overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-project-id]');
      if (!btn || btn.disabled) return;
      const projectId = Number(btn.dataset.projectId);
      if (projectId) this.select(projectId);
    });
  },

  async open() {
    const errorEl = document.getElementById('project-picker-error');
    const listEl = document.getElementById('project-picker-list');
    if (errorEl) errorEl.textContent = '';
    if (listEl) listEl.innerHTML = '<p class="project-picker-loading">Carregando projetos…</p>';

    this._overlay.classList.add('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    try {
      const data = await Storage.listMyProjects();
      this._projects = data.projects || [];
      this._render(data.active_project_id);
    } catch (err) {
      if (listEl) {
        listEl.innerHTML = `<p class="project-picker-empty">${UIList.escapeHtml(err.message || 'Erro ao carregar projetos.')}</p>`;
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  close() {
    this._overlay.classList.remove('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'true');
    if (
      !document.getElementById('modal-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('detail-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('settings-overlay')?.classList.contains('modal-overlay--open') &&
      !document.getElementById('confirm-overlay')?.classList.contains('modal-overlay--open')
    ) {
      document.body.style.overflow = '';
    }
  },

  _render(activeProjectId) {
    const listEl = document.getElementById('project-picker-list');
    if (!listEl) return;

    if (!this._projects.length) {
      listEl.innerHTML =
        '<p class="project-picker-empty">Nenhum projeto atribuído à sua conta.<br><span class="project-picker-empty__hint">Peça ao administrador para designá-lo a um projeto.</span></p>';
      return;
    }

    listEl.innerHTML = this._projects
      .map((project) => {
        const isActive = project.id === activeProjectId;
        return `
          <button
            type="button"
            class="project-picker-item${isActive ? ' project-picker-item--active' : ''}"
            data-project-id="${project.id}"
            ${isActive ? 'disabled aria-current="true"' : ''}
          >
            <span class="project-picker-item__name">${UIList.escapeHtml(project.name)}</span>
            ${isActive ? '<span class="project-picker-item__badge">Ativo</span>' : ''}
          </button>`;
      })
      .join('');
  },

  async select(projectId) {
    const errorEl = document.getElementById('project-picker-error');
    if (errorEl) errorEl.textContent = '';

    try {
      const updatedUser = await Storage.selectProject(projectId);
      Auth.setUser(updatedUser);
      Auth.applyHeaderBranding(updatedUser);
      this.close();
      await App.reloadProjectData();
      Toast.show('Projeto alterado', 'success', updatedUser.project_name || '');
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Não foi possível selecionar o projeto.';
    }
  },
};
