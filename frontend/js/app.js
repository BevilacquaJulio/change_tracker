// === App — bootstrap, render, confirmações e microinterações ===

const App = {
  _ready: false,

  async init() {
    if (!Auth.requireAuth()) return;

    UIConfirm.init();
    UILightbox.init();
    UIModal.init();
    UIModal.buildSelectOptions();
    UIDetail.init();
    Toast.init();
    UISettings.init();
    UIProjectPicker.init();

    this._bindButtonEffects();
    this._bindHeader();
    this._bindFilters();
    this._bindListDelegation();
    this._bindImport();

    Auth.updateAdminLockButton(Auth.getUser());

    this._showLoading();

    try {
      const user = await Auth.fetchMe();
      Auth.applyHeaderBranding(user);

      const data = await Storage.load();
      AppState.setItems(data.items || []);
      await this._refreshDashboard();
      this._ready = true;
      this._hideLoading();
      this.render();
    } catch (err) {
      this._hideLoading();
      this._showLoadError(err.message || 'Não foi possível carregar os dados.');
    }
  },

  async _refreshDashboard() {
    try {
      AppState.summary = await Storage.dashboardSummary();
    } catch {
      AppState.summary = null;
    }
    const el = document.getElementById('dashboard');
    if (el) UIDashboard.render(el, AppState.summary);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  async reloadProjectData() {
    if (!this._ready) return;

    UIDetail.close();
    UIModal.close();

    this._showLoading();
    try {
      const data = await Storage.load();
      AppState.setItems(data.items || []);
      await this._refreshDashboard();
      this.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar dados do projeto.', 'error');
    } finally {
      this._hideLoading();
    }
  },

  _showLoading() {
    const loading = document.getElementById('app-loading');
    const main = document.getElementById('app-main');
    if (loading) {
      loading.hidden = false;
      loading.setAttribute('aria-busy', 'true');
    }
    if (main) main.classList.add('main--hidden');
    document.body.setAttribute('aria-busy', 'true');
  },

  _hideLoading() {
    const loading = document.getElementById('app-loading');
    const main = document.getElementById('app-main');
    if (loading) {
      loading.hidden = true;
      loading.removeAttribute('aria-busy');
    }
    if (main) main.classList.remove('main--hidden');
    document.body.removeAttribute('aria-busy');
  },

  _showLoadError(message) {
    document.getElementById('dashboard').innerHTML = '';
    document.getElementById('filter-count').textContent = '';
    document.getElementById('items-list').innerHTML = `
      <div class="empty-state">
        <i data-lucide="server-off" class="empty-icon"></i>
        <p class="empty-title">Erro ao conectar com o servidor</p>
        <span class="empty-sub">${UIList.escapeHtml(message)}</span>
        <span class="empty-sub">Verifique se o backend está rodando e se o arquivo .env na raiz do projeto está configurado.</span>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  getFilteredItems() {
    return Filters.apply(
      AppState.items,
      AppState.filters,
      AppState.sortBy,
      AppState.sortDir
    );
  },

  render() {
    if (!this._ready) return;

    const filtered = this.getFilteredItems();

    UIDashboard.render(document.getElementById('dashboard'), AppState.summary);

    const countEl = document.getElementById('filter-count');
    const active = Filters.hasActiveFilters(AppState.filters);
    countEl.textContent = active
      ? `${filtered.length} de ${AppState.items.length} itens encontrados`
      : `${filtered.length} ${filtered.length === 1 ? 'item' : 'itens'} encontrados`;

    UIList.render(document.getElementById('items-list'), filtered);

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    UICustomSelect.enhance(document);
  },

  /** Ripple suave ao clicar em botões */
  _bindButtonEffects() {
    document.addEventListener(
      'click',
      (e) => {
        const btn = e.target.closest('.btn');
        if (!btn || btn.disabled) return;
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--ripple-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        btn.style.setProperty('--ripple-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 420);
      },
      true
    );
  },

  _bindHeader() {
    document.getElementById('btn-admin-lock')?.addEventListener('click', () => {
      if (!Auth.isAdmin()) return;
      window.location.href = '/admin';
    });

    document.getElementById('btn-new').addEventListener('click', () => UIModal.openCreate());
    document.getElementById('btn-export').addEventListener('click', () => {
      Storage.exportJSON(AppState.items);
      Toast.show('Backup exportado com sucesso', 'info', 'Arquivo JSON baixado');
    });
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      const ok = await UIConfirm.open({
        title: 'Sair da conta',
        message: 'Deseja encerrar a sessão atual?',
        confirmLabel: 'Sair',
        cancelLabel: 'Continuar',
        variant: 'warn',
        icon: 'log-out',
      });
      if (ok) Auth.logout();
    });
  },

  _bindFilters() {
    const typeEl = document.getElementById('filter-type');
    const urgEl = document.getElementById('filter-urgency');
    const searchEl = document.getElementById('filter-search');
    const sortEl = document.getElementById('filter-sort');

    typeEl.innerHTML =
      '<option value="">Todos os tipos</option>' + TYPES.map((t) => `<option value="${t}">${t}</option>`).join('');
    urgEl.innerHTML =
      '<option value="">Todas urgências</option>' +
      URGENCY_FILTER_ORDER.map((u) => `<option value="${u}">${u}</option>`).join('');

    const onFilterChange = () => {
      AppState.filters.type = typeEl.value;
      AppState.filters.urgency = urgEl.value;
      this.render();
    };

    typeEl.addEventListener('change', onFilterChange);
    urgEl.addEventListener('change', onFilterChange);

    searchEl.addEventListener('input', () => {
      Filters.debounce(() => {
        AppState.filters.search = searchEl.value;
        this.render();
      });
    });

    sortEl.addEventListener('change', () => {
      const [sortBy, sortDir] = sortEl.value.split(':');
      AppState.sortBy = sortBy;
      AppState.sortDir = sortDir;
      this.render();
    });
  },

  _bindListDelegation() {
    const list = document.getElementById('items-list');
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      switch (action) {
        case 'new-item':
          UIModal.openCreate();
          break;
        case 'open-detail':
          UIDetail.open(id);
          break;
        case 'edit':
          UIModal.openEdit(id);
          break;
        case 'delete':
          await this._confirmDelete(id);
          break;
        case 'open-url': {
          const url = btn.dataset.url;
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          break;
        }
        case 'quick-status':
          await this._confirmQuickStatus(id, btn.dataset.target, btn.dataset.label, btn.dataset.confirmVariant);
          break;
        case 'archive':
          await this._confirmArchive(id);
          break;
        case 'reopen':
          await this._reopen(id);
          break;
      }
    });
  },

  async _confirmArchive(id) {
    const item = AppState.getItemById(id);
    if (!item) return;

    const ok = await UIConfirm.open({
      title: 'Arquivar item',
      message: `Arquivar <strong>${UIList.escapeHtml(item.title)}</strong>?<br><br>Ele sai das métricas ativas, mas pode ser desarquivado depois.`,
      confirmLabel: 'Arquivar',
      cancelLabel: 'Cancelar',
      variant: 'warn',
      icon: 'archive',
    });
    if (!ok) return;

    try {
      const updated = await Storage.archiveItem(id);
      AppState.replaceItem(updated);
      await this._refreshDashboard();
      Toast.show('Item arquivado', 'info', item.title);
      this.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao arquivar', 'error');
    }
  },

  async _reopen(id) {
    const item = AppState.getItemById(id);
    if (!item) return;

    try {
      const updated = await Storage.reopenItem(id);
      AppState.replaceItem(updated);
      await this._refreshDashboard();
      Toast.show('Item desarquivado', 'success', item.title);
      this.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao desarquivar', 'error');
    }
  },

  async _confirmDelete(id) {
    const item = AppState.getItemById(id);
    if (!item) return;

    const ok = await UIConfirm.open({
      title: 'Confirmar exclusão',
      message: `Excluir o item <strong>${UIList.escapeHtml(item.title)}</strong>?<br><br>Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Manter item',
      variant: 'danger',
      icon: 'trash-2',
    });

    if (!ok) return;

    try {
      await Storage.deleteItem(id);
      AppState.removeItem(id);
      await this._refreshDashboard();
      Toast.show('Item excluído', 'warn', item.title);
      this.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao excluir', 'error');
    }
  },

  async _confirmQuickStatus(id, target, actionLabel, confirmVariant) {
    const item = AppState.getItemById(id);
    if (!item || !target) return;

    const ok = await UIConfirm.open({
      title: 'Confirmar alteração de status',
      message: `Alterar <strong>${UIList.escapeHtml(item.title)}</strong> de <em>${item.status}</em> para <em>${target}</em>?`,
      confirmLabel: actionLabel || 'Confirmar',
      cancelLabel: 'Cancelar',
      variant: confirmVariant || 'primary',
      icon: target === 'Concluído' ? 'check-check' : target === 'Cancelado' ? 'x-circle' : 'arrow-right',
    });

    if (!ok) return;

    try {
      const updated = await Storage.updateStatus(id, target);
      AppState.replaceItem(updated);
      await this._refreshDashboard();
      Toast.show('Status atualizado', 'info', `Agora em ${target}`);
      this.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao atualizar status', 'error');
    }
  },

  _bindImport() {
    document.getElementById('import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;

      try {
        const items = await Storage.parseImportFile(file);

        const ok = await UIConfirm.open({
          title: 'Confirmar importação',
          message: `Importar <strong>${items.length}</strong> itens do arquivo?<br><br>Os <strong>${AppState.items.length}</strong> itens atuais serão <strong>substituídos</strong>. Imagens em base64 serão convertidas em arquivos no servidor.`,
          confirmLabel: 'Importar e substituir',
          cancelLabel: 'Cancelar',
          variant: 'warn',
          icon: 'upload',
        });

        if (!ok) return;

        const imported = await Storage.importItems(items);
        AppState.setItems(imported);
        await this._refreshDashboard();
        Toast.show('Dados importados com sucesso', 'success', `${imported.length} itens carregados`);
        this.render();
      } catch (err) {
        Toast.show(err.message || 'Erro na importação', 'error');
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
