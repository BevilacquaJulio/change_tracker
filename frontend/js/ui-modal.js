// === UI Modal — criar e editar itens (formulário simplificado) ===

const UIModal = {
  _overlay: null,
  _form: null,
  _titleEl: null,
  _snapshot: null,
  _evidenceList: [],
  _evidenceIndex: 0,
  _defaultCreateTitle: 'Novo item de mudança',
  _defaultEditTitle: 'Editar item de mudança',

  init() {
    this._overlay = document.getElementById('modal-overlay');
    this._form = document.getElementById('item-form');
    this._titleEl = document.getElementById('modal-title');
    this._buildUrgencyPicker();
    this._bindForm();
    this._bindEvidence();
  },

  _buildUrgencyPicker() {
    const container = document.getElementById('urgency-picker');
    if (!container || container.dataset.built) return;
    container.dataset.built = '1';
    container.innerHTML = URGENCY_PICKER.map(
      (u) => `
      <button type="button" class="urgency-picker__option" data-urgency="${u.value}" role="radio" aria-checked="false">
        <span class="urgency-ring ${u.ring}" aria-hidden="true"></span>
        <span class="urgency-picker__label">${u.value}</span>
      </button>
    `
    ).join('');

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-urgency]');
      if (!btn) return;
      this._setUrgency(btn.dataset.urgency);
    });
    this._clearUrgency();
  },

  _clearUrgency() {
    this._setUrgency('');
  },

  _setUrgency(value) {
    const hidden = document.getElementById('input-urgency');
    if (hidden) hidden.value = value || '';
    document.querySelectorAll('#urgency-picker .urgency-picker__option').forEach((el) => {
      const on = !!value && el.dataset.urgency === value;
      el.classList.toggle('is-selected', on);
      el.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    const errEl = document.getElementById('error-urgency');
    if (errEl && value) errEl.textContent = '';
  },

  _bindEvidence() {
    const fileInput = document.getElementById('evidence-file');
    const dropzone = document.getElementById('evidence-dropzone');
    const browse = document.getElementById('btn-evidence-browse');
    const addMore = document.getElementById('btn-evidence-add');
    const remove = document.getElementById('btn-evidence-remove');

    const openPicker = (e) => {
      e?.stopPropagation();
      if (this._evidenceList.length >= EVIDENCE_MAX_FILES) {
        Toast.show(`Limite de ${EVIDENCE_MAX_FILES} imagens atingido.`, 'warn');
        return;
      }
      fileInput.click();
    };

    browse?.addEventListener('click', openPicker);
    addMore?.addEventListener('click', openPicker);
    remove?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._removeCurrentEvidence();
    });

    fileInput?.addEventListener('change', () => {
      if (fileInput.files?.length) this._loadEvidenceFiles(fileInput.files);
      fileInput.value = '';
    });

    dropzone?.addEventListener('click', (e) => {
      if (e.target.closest('button') && !e.target.closest('#btn-evidence-browse')) return;
      if (e.target.closest('#btn-evidence-browse')) return;
      if (e.target.closest('[data-evidence-carousel]')) return;
      openPicker(e);
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer.files?.length) this._loadEvidenceFiles(e.dataTransfer.files);
    });
  },

  async _loadEvidenceFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      Toast.show('Envie apenas arquivos de imagem.', 'error');
      return;
    }

    const room = EVIDENCE_MAX_FILES - this._evidenceList.length;
    if (room <= 0) {
      Toast.show(`Limite de ${EVIDENCE_MAX_FILES} imagens atingido.`, 'warn');
      return;
    }

    const batch = files.slice(0, room);
    if (files.length > room) {
      Toast.show(`Apenas ${room} imagem(ns) adicionada(s). Limite: ${EVIDENCE_MAX_FILES}.`, 'warn');
    }

    const startIndex = this._evidenceList.length;
    for (const file of batch) {
      if (file.size > EVIDENCE_MAX_BYTES) {
        Toast.show(`"${file.name}" excede 2 MB e foi ignorado.`, 'error');
        continue;
      }
      try {
        const data = await this._readFileAsDataURL(file);
        this._evidenceList.push(data);
      } catch {
        Toast.show(`Não foi possível ler "${file.name}".`, 'error');
      }
    }

    if (this._evidenceList.length > startIndex) {
      this._evidenceIndex = startIndex;
      this._renderEvidenceUI();
    }
  },

  _readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  _removeCurrentEvidence() {
    if (!this._evidenceList.length) return;
    const host = document.getElementById('evidence-carousel-host');
    const carousel = host?.querySelector('[data-evidence-carousel]');
    const index = carousel
      ? parseInt(carousel.dataset.currentIndex || '0', 10)
      : Math.min(this._evidenceIndex, this._evidenceList.length - 1);
    this._evidenceList.splice(index, 1);
    this._evidenceIndex = Math.max(0, index - 1);
    this._renderEvidenceUI();
  },

  _renderEvidenceUI() {
    const empty = document.getElementById('evidence-empty');
    const gallery = document.getElementById('evidence-gallery');
    const host = document.getElementById('evidence-carousel-host');
    const addBtn = document.getElementById('btn-evidence-add');
    const hasItems = this._evidenceList.length > 0;

    empty?.classList.toggle('hidden', hasItems);
    gallery?.classList.toggle('hidden', !hasItems);
    if (addBtn) addBtn.disabled = this._evidenceList.length >= EVIDENCE_MAX_FILES;

    if (!hasItems || !host) return;

    host.innerHTML = UIEvidence.renderCarousel(this._evidenceList, { openAction: 'open-lightbox-modal' });
    const carousel = UIEvidence.bindCarousel(host, {
      lightboxAction: 'open-lightbox-modal',
      onLightbox: (images, i) => UILightbox.openGallery(images, i),
    });
    UIEvidence.goTo(carousel, this._evidenceIndex);

    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [host] });
  },

  _setEvidenceList(list, index = 0) {
    this._evidenceList = [...list];
    this._evidenceIndex = Math.max(0, Math.min(index, this._evidenceList.length - 1));
    this._renderEvidenceUI();
  },

  _clearEvidence() {
    this._evidenceList = [];
    this._evidenceIndex = 0;
    document.getElementById('evidence-empty')?.classList.remove('hidden');
    document.getElementById('evidence-gallery')?.classList.add('hidden');
    const host = document.getElementById('evidence-carousel-host');
    if (host) host.innerHTML = '';
  },

  _bindForm() {
    this._form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._save();
    });

    document.getElementById('modal-close').addEventListener('click', () => this._requestClose());
    document.getElementById('modal-cancel').addEventListener('click', () => this._requestClose());

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this._requestClose();
    });

    document.getElementById('btn-open-url').addEventListener('click', () => {
      const url = (this._form.elements.url.value || '').trim();
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else Toast.show('Informe uma URL válida.', 'error');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay.classList.contains('modal-overlay--open')) {
        this._requestClose();
      }
    });

    this._form.elements.title?.addEventListener('input', () => this._syncModalTitle());
  },

  _syncModalTitle() {
    const typed = (this._form.elements.title?.value || '').trim();
    const fallback = AppState.editingId ? this._defaultEditTitle : this._defaultCreateTitle;
    this._titleEl.textContent = typed || fallback;
  },

  _options(arr, selected) {
    return arr
      .map((v) => `<option value="${UIList.escapeHtml(v)}"${v === selected ? ' selected' : ''}>${UIList.escapeHtml(v)}</option>`)
      .join('');
  },

  openCreate() {
    AppState.editingId = null;
    const item = Model.createItem({ urgency: '' });
    this._fillForm(item);
    this._show();
    this._focusFirst();
  },

  openEdit(id) {
    const item = AppState.getItemById(id);
    if (!item) return;
    AppState.editingId = id;
    this._fillForm(item);
    this._show();
    this._focusFirst();
  },

  _updateSelectOptions(selectId, options, selected) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = this._options(options, selected);
    if (sel._customSyncOptions) sel._customSyncOptions();
  },

  _fillForm(item) {
    const set = (name, val) => {
      const el = this._form.elements[name];
      if (el) el.value = val ?? '';
    };
    set('type', item.type);
    set('url', item.url);
    set('discoveryDate', item.discoveryDate);
    set('title', item.title);
    set('description', item.description);
    set('actionRequired', item.actionRequired);
    this._updateSelectOptions('select-type', TYPES, item.type || DEFAULT_ITEM.type);
    this._setUrgency(item.urgency || '');

    this._setEvidenceList(UIEvidence.getImages(item));

    this._clearErrors();
    this._syncModalTitle();
    this._snapshot = JSON.stringify(this._readForm());
  },

  _isDirty() {
    return this._snapshot !== JSON.stringify(this._readForm());
  },

  async _requestClose() {
    if (this._isDirty()) {
      const ok = await UIConfirm.open({
        title: 'Descartar alterações?',
        message: 'Existem alterações não salvas neste formulário. Deseja sair sem salvar?',
        confirmLabel: 'Descartar',
        cancelLabel: 'Continuar editando',
        variant: 'warn',
        icon: 'alert-triangle',
      });
      if (!ok) return;
    }
    this.close();
  },

  _readForm() {
    const fd = new FormData(this._form);
    return {
      type: fd.get('type'),
      url: (fd.get('url') || '').trim(),
      discoveryDate: fd.get('discoveryDate'),
      title: (fd.get('title') || '').trim(),
      description: (fd.get('description') || '').trim(),
      actionRequired: (fd.get('actionRequired') || '').trim(),
      urgency: (fd.get('urgency') || '').trim(),
      evidence: [...this._evidenceList],
    };
  },

  async _save() {
    const data = this._readForm();
    const errors = Model.validate(data);
    this._clearErrors();

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([k, msg]) => {
        const errEl = document.getElementById(`error-${k}`);
        if (errEl) errEl.textContent = msg;
      });
      if (errors.urgency) {
        document.getElementById('urgency-picker')?.querySelector('.urgency-picker__option')?.focus();
      } else {
        this._form.elements.title?.focus();
      }
      return;
    }

    const submitBtn = this._overlay.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (AppState.editingId) {
        const updated = await Storage.updateItem(AppState.editingId, data);
        AppState.replaceItem(updated);
        Toast.show('Item salvo com sucesso', 'success', updated.title);
      } else {
        const draft = Model.createItem({
          ...data,
          effort: DEFAULT_ITEM.effort,
          status: DEFAULT_ITEM.status,
        });
        const created = await Storage.createItem({
          id: draft.id,
          type: data.type,
          url: data.url,
          discoveryDate: data.discoveryDate,
          title: data.title,
          description: data.description,
          actionRequired: data.actionRequired,
          urgency: data.urgency,
          effort: DEFAULT_ITEM.effort,
          status: DEFAULT_ITEM.status,
          evidence: data.evidence,
        });
        AppState.replaceItem(created);
        Toast.show('Item criado com sucesso', 'success', `${created.type} — ${created.title}`);
      }

      this.close();
      await App._refreshDashboard();
      App.render();
    } catch (err) {
      Toast.show(err.message || 'Erro ao salvar item', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  _clearErrors() {
    this._form.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
  },

  _show() {
    this._overlay.classList.add('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    this._form.scrollTop = 0;
    requestAnimationFrame(() => {
      this._form.scrollTop = 0;
      UICustomSelect.enhance(this._form);
      if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [this._form] });
    });
  },

  close() {
    this._form.scrollTop = 0;
    this._overlay.classList.remove('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'true');
    if (
      !document.getElementById('detail-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('lightbox-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('confirm-overlay').classList.contains('modal-overlay--open')
    ) {
      document.body.classList.remove('modal-open');
    }
    AppState.editingId = null;
    this._snapshot = null;
    this._clearEvidence();
  },

  _focusFirst() {
    requestAnimationFrame(() => {
      this._form.scrollTop = 0;
      const el = document.getElementById('select-type') || this._form.querySelector('select, input, textarea');
      if (el) el.focus({ preventScroll: true });
    });
  },

  buildSelectOptions() {
    this._updateSelectOptions('select-type', TYPES, DEFAULT_ITEM.type);
  },
};
