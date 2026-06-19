// === Admin — gestão de projetos e usuários (página /admin) ===

const UIAdmin = {
  _users: [],
  _projects: [],
  _pendingCount: 0,

  // Estado do modal de atribuição
  _assignUserId: null,

  async initPage() {
    if (!Auth.requireAuth()) return;

    Toast.init();
    UIConfirm.init();

    try {
      const user = await Auth.fetchMe();
      if (user.role !== 'admin' || user.status !== 'active') {
        window.location.href = Auth.APP_URL;
        return;
      }
    } catch {
      window.location.href = Auth.APP_URL;
      return;
    }

    this._bindUnlock();
    this._bindPanel();
    this._bindProjectsModal();
    this._bindAssignModal();

    if (Auth.isAdminUnlocked()) {
      this.showPanel();
    } else {
      this.showGate();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  showGate() {
    document.getElementById('admin-gate')?.removeAttribute('hidden');
    document.getElementById('admin-panel')?.setAttribute('hidden', '');
    document.getElementById('admin-unlock-password')?.focus();
  },

  showPanel() {
    document.getElementById('admin-gate')?.setAttribute('hidden', '');
    document.getElementById('admin-panel')?.removeAttribute('hidden');
    this.refresh();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  // ── Unlock ─────────────────────────────────────────────────────────────────

  _bindUnlock() {
    const form = document.getElementById('admin-unlock-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('admin-unlock-error');
      const submitBtn = document.getElementById('admin-unlock-submit');
      const password = document.getElementById('admin-unlock-password').value;
      errorEl.textContent = '';

      submitBtn.disabled = true;
      try {
        await Storage.adminUnlock(password);
        Auth.setAdminUnlocked(true);
        document.getElementById('admin-unlock-password').value = '';
        this.showPanel();
      } catch (err) {
        errorEl.textContent = err.message || 'Senha incorreta.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  },

  // ── Painel ─────────────────────────────────────────────────────────────────

  _bindPanel() {
    document.getElementById('admin-refresh')?.addEventListener('click', () => this.refresh());

    document.getElementById('admin-lock-again')?.addEventListener('click', () => {
      Auth.setAdminUnlocked(false);
      this.showGate();
    });

    document.getElementById('btn-manage-projects')?.addEventListener('click', () => {
      this._openProjectsModal();
    });

    document.getElementById('admin-panel')?.addEventListener('click', (e) => {
      this._handleUserActionClick(e);
    });
  },

  async _handleUserActionClick(e) {
    const btn = e.target.closest('[data-admin-action]');
    if (!btn || btn.disabled) return;
    const action = btn.dataset.adminAction;
    const userId = Number(btn.dataset.userId);

    if (action === 'approve' && userId) {
      await this._runAction(() => Storage.adminApproveUser(userId), 'Usuário aprovado.');

    } else if (action === 'reject' && userId) {
      const ok = await UIConfirm.open({
        title: 'Recusar cadastro',
        message: 'Deseja recusar esta solicitação de acesso?',
        confirmLabel: 'Recusar',
        cancelLabel: 'Cancelar',
        variant: 'danger',
        icon: 'user-x',
      });
      if (!ok) return;
      await this._runAction(() => Storage.adminRejectUser(userId), 'Solicitação recusada.');

    } else if (action === 'delete' && userId) {
      const ok = await UIConfirm.open({
        title: 'Excluir usuário',
        message: 'Esta ação remove o usuário e todos os tickets dele. Continuar?',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        variant: 'danger',
        icon: 'trash-2',
      });
      if (!ok) return;
      await this._runAction(() => Storage.adminDeleteUser(userId), 'Usuário excluído.');

    } else if (action === 'save-role' && userId) {
      const row = btn.closest('[data-user-row]');
      const role = row.querySelector('[data-field="role"]')?.value;
      await this._runAction(
        () => Storage.adminUpdateUser(userId, { role }),
        'Papel atualizado.',
        userId
      );

    } else if (action === 'assign-projects' && userId) {
      this._openAssignModal(userId);
    }
  },

  async _runAction(fn, successMessage, userId = null) {
    try {
      await fn();
      Toast.show(successMessage, 'success');
      const me = Auth.getUser();
      if (userId && me && me.id === userId) {
        const user = await Auth.fetchMe();
        Auth.applyHeaderBranding(user);
      }
      await this.refresh();
    } catch (err) {
      Toast.show(err.message || 'Não foi possível concluir.', 'error');
    }
  },

  // ── Dados ──────────────────────────────────────────────────────────────────

  async refresh() {
    const loading = document.getElementById('admin-loading');
    const usersBody = document.getElementById('admin-users-body');
    if (loading) loading.hidden = false;
    if (usersBody) usersBody.innerHTML = '';

    try {
      const [usersData, projectsData] = await Promise.all([
        Storage.adminListUsers(),
        Storage.adminListProjects(),
      ]);
      this._users = usersData.users || [];
      this._projects = projectsData.projects || [];
      this._pendingCount = usersData.pending_count || 0;
      this._render();
    } catch (err) {
      if (usersBody) {
        usersBody.innerHTML = `<p class="admin-empty">${UIList.escapeHtml(err.message || 'Erro ao carregar dados.')}</p>`;
      }
    } finally {
      if (loading) loading.hidden = true;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  },

  _render() {
    this._renderUsers();
  },

  // ── Render usuários ────────────────────────────────────────────────────────

  _renderUsers() {
    const badge = document.getElementById('admin-pending-badge');
    if (badge) {
      badge.textContent = String(this._pendingCount);
      badge.hidden = this._pendingCount === 0;
    }

    const pendingSection = document.getElementById('admin-pending-section');
    const pendingBody = document.getElementById('admin-pending-body');
    const allBody = document.getElementById('admin-users-body');

    const pending = this._users.filter((u) => u.status === 'pending');
    const others = this._users.filter((u) => u.status !== 'pending');

    if (pendingSection) pendingSection.hidden = pending.length === 0;
    if (pendingBody) pendingBody.innerHTML = pending.map((u) => this._renderPendingCard(u)).join('');
    if (allBody) {
      allBody.innerHTML = others.length
        ? others.map((u) => this._renderUserRow(u)).join('')
        : '<p class="admin-empty">Nenhum usuário cadastrado além das solicitações pendentes.</p>';
    }

    if (typeof UICustomSelect !== 'undefined') {
      allBody?.querySelectorAll('select.form-select').forEach((sel) => {
        UICustomSelect.enhance(sel.parentElement);
      });
    }
  },

  _renderPendingCard(user) {
    return `
      <article class="admin-pending-card">
        <div class="admin-pending-card__info">
          <strong>${UIList.escapeHtml(user.name)}</strong>
          <span>${UIList.escapeHtml(user.email)}</span>
          <span class="admin-meta">Solicitado em ${UIList.escapeHtml(Model.formatDateTime(user.created_at))}</span>
        </div>
        <div class="admin-pending-card__actions">
          <button type="button" class="btn btn--primary btn--sm" data-admin-action="approve" data-user-id="${user.id}">
            <i data-lucide="user-check"></i> Aprovar
          </button>
          <button type="button" class="btn btn--ghost btn--sm" data-admin-action="reject" data-user-id="${user.id}">
            <i data-lucide="user-x"></i> Recusar
          </button>
        </div>
      </article>`;
  },

  _renderUserRow(user) {
    const me = Auth.getUser();
    const isSelf = me && me.id === user.id;
    const isAdmin = user.role === 'admin';

    const statusLabel = { active: 'Ativo', pending: 'Pendente', rejected: 'Recusado' }[user.status] || user.status;

    const assignedProjects = (user.project_ids || [])
      .map((pid) => this._projects.find((p) => p.id === pid))
      .filter(Boolean);

    let projectTags;
    if (isAdmin) {
      projectTags = this._projects.length
        ? `<span class="admin-project-tag admin-project-tag--all">Todos os projetos (${this._projects.length})</span>`
        : '<span class="admin-meta">Administrador — acesso automático a todos os projetos</span>';
    } else {
      projectTags = assignedProjects.length
        ? assignedProjects
            .map((p) => `<span class="admin-project-tag">${UIList.escapeHtml(p.name)}</span>`)
            .join('')
        : '<span class="admin-meta">Nenhum projeto atribuído</span>';
    }

    return `
      <div class="admin-user-row" data-user-row data-user-id="${user.id}">

        <div class="admin-user-row__header">
          <div class="admin-user-row__identity">
            <strong>${UIList.escapeHtml(user.name)}</strong>
            <span>${UIList.escapeHtml(user.email)}</span>
          </div>
          <span class="admin-badge admin-badge--${user.status}">${UIList.escapeHtml(statusLabel)}</span>
        </div>

        <div class="admin-user-row__projects">
          <span class="admin-user-row__projects-label">Projetos</span>
          <div class="admin-user-row__project-tags">${projectTags}</div>
        </div>

        <div class="admin-user-row__footer">
          <label class="admin-role-field">
            <span>Papel</span>
            <select class="form-select" data-field="role" ${isSelf ? 'disabled' : ''}>
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuário</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </label>

          <div class="admin-user-row__actions">
            <button type="button" class="btn btn--ghost btn--sm" data-admin-action="save-role" data-user-id="${user.id}">
              <i data-lucide="save"></i> Salvar papel
            </button>
            ${
              isAdmin
                ? ''
                : `<button type="button" class="btn btn--ghost btn--sm" data-admin-action="assign-projects" data-user-id="${user.id}">
                    <i data-lucide="folder-plus"></i> Atribuir projeto
                  </button>`
            }
            ${isSelf ? '' : `
            <button type="button" class="btn btn--ghost btn--sm btn--danger-ghost" data-admin-action="delete" data-user-id="${user.id}">
              <i data-lucide="trash-2"></i> Excluir
            </button>`}
          </div>
        </div>

      </div>`;
  },

  // ── Modal: Gerenciar Projetos ───────────────────────────────────────────────

  _bindProjectsModal() {
    const overlay = document.getElementById('projects-modal-overlay');
    if (!overlay) return;

    document.getElementById('projects-modal-close')?.addEventListener('click', () => this._closeProjectsModal());
    document.getElementById('projects-modal-cancel')?.addEventListener('click', () => this._closeProjectsModal());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeProjectsModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('modal-overlay--open')) {
        this._closeProjectsModal();
      }
    });

    document.getElementById('admin-project-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._createProject();
    });

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-project-action]');
      if (!btn || btn.disabled) return;
      const action = btn.dataset.projectAction;
      const projectId = Number(btn.dataset.projectId);

      if (action === 'save' && projectId) {
        const row = btn.closest('[data-project-row]');
        const name = row.querySelector('[data-field="project_name"]')?.value?.trim();
        this._saveProject(projectId, name);
      } else if (action === 'delete' && projectId) {
        this._deleteProject(projectId);
      }
    });
  },

  _openProjectsModal() {
    const overlay = document.getElementById('projects-modal-overlay');
    if (!overlay) return;
    this._renderProjectsList();
    overlay.classList.add('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('admin-project-name')?.focus();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  _closeProjectsModal() {
    const overlay = document.getElementById('projects-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  _renderProjectsList() {
    const body = document.getElementById('admin-projects-body');
    const errorEl = document.getElementById('admin-project-error');
    if (errorEl) errorEl.textContent = '';
    if (!body) return;

    body.innerHTML = this._projects.length
      ? this._projects.map((p) => this._renderProjectRow(p)).join('')
      : '<p class="admin-empty" style="margin-top: var(--space-md);">Nenhum projeto criado ainda.</p>';

    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  _renderProjectRow(project) {
    return `
      <div class="admin-project-row" data-project-row data-project-id="${project.id}">
        <div class="admin-project-row__info">
          <input
            class="form-input form-input--sm"
            type="text"
            data-field="project_name"
            value="${UIList.escapeHtml(project.name)}"
            maxlength="120"
            aria-label="Nome do projeto"
          />
          <span class="admin-meta">${project.member_count} ${project.member_count === 1 ? 'usuário' : 'usuários'}</span>
        </div>
        <div class="admin-project-row__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-project-action="save" data-project-id="${project.id}">
            <i data-lucide="save"></i> Renomear
          </button>
          <button type="button" class="btn btn--ghost btn--sm btn--danger-ghost" data-project-action="delete" data-project-id="${project.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>`;
  },

  async _createProject() {
    const input = document.getElementById('admin-project-name');
    const errorEl = document.getElementById('admin-project-error');
    const submitBtn = document.getElementById('admin-project-create');
    const name = input?.value.trim() || '';
    if (errorEl) errorEl.textContent = '';

    if (name.length < 2) {
      if (errorEl) errorEl.textContent = 'Informe o nome do projeto (mínimo 2 caracteres).';
      return;
    }

    submitBtn.disabled = true;
    try {
      await Storage.adminCreateProject(name);
      if (input) input.value = '';
      Toast.show('Projeto criado', 'success', name);
      await this._reloadProjects();
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Não foi possível criar o projeto.';
    } finally {
      submitBtn.disabled = false;
    }
  },

  async _saveProject(projectId, name) {
    if (!name || name.length < 2) {
      Toast.show('Informe um nome válido (mínimo 2 caracteres).', 'error');
      return;
    }
    try {
      await Storage.adminUpdateProject(projectId, name);
      Toast.show('Projeto renomeado', 'success', name);
      await this._reloadProjects();
    } catch (err) {
      Toast.show(err.message || 'Não foi possível renomear.', 'error');
    }
  },

  async _deleteProject(projectId) {
    const project = this._projects.find((p) => p.id === projectId);
    const ok = await UIConfirm.open({
      title: 'Excluir projeto',
      message: `Excluir <strong>${UIList.escapeHtml(project?.name || '')}</strong>? Usuários perderão a associação.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      variant: 'danger',
      icon: 'trash-2',
    });
    if (!ok) return;

    try {
      await Storage.adminDeleteProject(projectId);
      Toast.show('Projeto excluído', 'success');
      await this._reloadProjects();
    } catch (err) {
      Toast.show(err.message || 'Não foi possível excluir.', 'error');
    }
  },

  async _reloadProjects() {
    try {
      const projectsData = await Storage.adminListProjects();
      this._projects = projectsData.projects || [];
    } catch {
      // mantém lista anterior
    }
    this._renderProjectsList();
    this._renderUsers();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  // ── Modal: Atribuir projetos ao usuário ────────────────────────────────────

  _bindAssignModal() {
    const overlay = document.getElementById('assign-modal-overlay');
    if (!overlay) return;

    document.getElementById('assign-modal-close')?.addEventListener('click', () => this._closeAssignModal());
    document.getElementById('assign-modal-cancel')?.addEventListener('click', () => this._closeAssignModal());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeAssignModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('modal-overlay--open')) {
        this._closeAssignModal();
      }
    });

    document.getElementById('assign-modal-save')?.addEventListener('click', () => {
      this._saveAssignment();
    });
  },

  _openAssignModal(userId) {
    const user = this._users.find((u) => u.id === userId);
    if (!user) return;

    if (user.role === 'admin') {
      Toast.show('Administradores participam de todos os projetos automaticamente.', 'info');
      return;
    }

    this._assignUserId = userId;

    const nameEl = document.getElementById('assign-modal-user-name');
    if (nameEl) nameEl.textContent = `${user.name} — ${user.email}`;

    const errorEl = document.getElementById('assign-modal-error');
    if (errorEl) errorEl.textContent = '';

    const listEl = document.getElementById('assign-modal-list');
    if (listEl) {
      if (!this._projects.length) {
        listEl.innerHTML = '<p class="admin-empty">Nenhum projeto disponível. Crie projetos primeiro.</p>';
      } else {
        listEl.innerHTML = this._projects
          .map((p) => {
            const checked = (user.project_ids || []).includes(p.id) ? 'checked' : '';
            return `
              <label class="admin-assign-item">
                <input type="checkbox" data-assign-project="${p.id}" ${checked} />
                <span class="admin-assign-item__name">${UIList.escapeHtml(p.name)}</span>
                <span class="admin-meta">${p.member_count} ${p.member_count === 1 ? 'usuário' : 'usuários'}</span>
              </label>`;
          })
          .join('');
      }
    }

    const overlay = document.getElementById('assign-modal-overlay');
    overlay.classList.add('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  _closeAssignModal() {
    const overlay = document.getElementById('assign-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
    this._assignUserId = null;
    document.body.style.overflow = '';
  },

  async _saveAssignment() {
    const userId = this._assignUserId;
    if (!userId) return;

    const errorEl = document.getElementById('assign-modal-error');
    if (errorEl) errorEl.textContent = '';

    const saveBtn = document.getElementById('assign-modal-save');
    const projectIds = [
      ...document.querySelectorAll('#assign-modal-list [data-assign-project]:checked'),
    ].map((el) => Number(el.dataset.assignProject));

    saveBtn.disabled = true;
    try {
      await Storage.adminUpdateUser(userId, { project_ids: projectIds });
      Toast.show('Projetos atribuídos', 'success');
      this._closeAssignModal();
      await this.refresh();
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Não foi possível salvar.';
    } finally {
      saveBtn.disabled = false;
    }
  },
};
