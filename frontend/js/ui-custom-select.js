// === UI Custom Select — dropdowns glass em substituição ao select nativo ===
// O menu é "portado" para o <body> ao abrir, escapando de containers com
// transform/overflow (ex.: o modal animado). Assim o posicionamento fixed
// sempre fica relativo à viewport e ancorado exatamente ao gatilho.

const UICustomSelect = {
  _openWrap: null,
  _reposition: null,

  _escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  enhance(root = document) {
    const scope = root || document;
    const selects = scope.querySelectorAll('select.form-select');
    selects.forEach((sel) => this._wrap(sel));
    this._bindGlobalClose();
  },

  _isUrgencySelect(select) {
    return select.id === 'filter-urgency';
  },

  _urgencyRing(value, lit = true) {
    const ring = URGENCY_THEME[value]?.ring || '';
    const litCls = lit ? ' urgency-ring--lit' : '';
    return `<span class="urgency-ring ${ring}${litCls}" aria-hidden="true"></span>`;
  },

  _urgencyLabel(value, text) {
    if (!value) return this._escape(text);
    return `<span class="urgency-option">${this._urgencyRing(value)}<span>${this._escape(text)}</span></span>`;
  },

  _wrap(select) {
    if (select.dataset.customEnhanced === '1') return;

    const parent = select.parentElement;
    const wrap = document.createElement('div');
    wrap.className = 'select-wrap';
    if (this._isUrgencySelect(select)) wrap.classList.add('select-wrap--urgency');
    parent.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('form-select--native');
    select.dataset.customEnhanced = '1';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const valueSpan = document.createElement('span');
    valueSpan.className = 'custom-select__value';

    const chevron = document.createElement('span');
    chevron.className = 'custom-select__chevron';
    chevron.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

    trigger.append(valueSpan, chevron);

    const menu = document.createElement('ul');
    menu.className = 'custom-select__menu';
    menu.setAttribute('role', 'listbox');

    wrap.insertBefore(trigger, select);
    wrap.insertBefore(menu, select);

    // Referências cruzadas para o portal
    wrap._menu = menu;
    wrap._trigger = trigger;
    wrap._select = select;
    wrap._valueSpan = valueSpan;
    menu._wrap = wrap;

    const syncOptions = () => {
      const isUrgency = this._isUrgencySelect(select);
      menu.innerHTML = '';
      Array.from(select.options).forEach((opt) => {
        const li = document.createElement('li');
        li.className = 'custom-select__option';
        li.setAttribute('role', 'option');
        li.dataset.value = opt.value;
        if (opt.value && isUrgency) li.dataset.urgency = opt.value;
        const labelHtml = isUrgency
          ? `<span class="custom-select__option-label">${this._urgencyLabel(opt.value, opt.textContent)}</span>`
          : `<span class="custom-select__option-label">${this._escape(opt.textContent)}</span>`;
        li.innerHTML = `${labelHtml}<i data-lucide="check" class="custom-select__check"></i>`;
        if (opt.selected) li.classList.add('is-selected');
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          this._pick(wrap, value(opt));
        });
        menu.appendChild(li);
      });
      if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [menu] });
      this._syncLabel(wrap);
    };
    const value = (opt) => opt.value;

    syncOptions();
    select._customSyncOptions = syncOptions;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggle(wrap);
    });

    trigger.addEventListener('keydown', (e) => this._onTriggerKey(e, wrap));
    select.addEventListener('change', () => this._syncLabel(wrap));
  },

  _syncLabel(wrap) {
    const select = wrap._select;
    const opt = select.options[select.selectedIndex];
    const isUrgency = this._isUrgencySelect(select);

    if (isUrgency) {
      if (opt?.value) {
        wrap._valueSpan.innerHTML = this._urgencyLabel(opt.value, opt.textContent);
        wrap.dataset.urgency = opt.value;
      } else {
        wrap._valueSpan.textContent = opt ? opt.textContent : '';
        delete wrap.dataset.urgency;
      }
    } else {
      wrap._valueSpan.textContent = opt ? opt.textContent : '';
    }

    wrap._menu.querySelectorAll('.custom-select__option').forEach((li) => {
      li.classList.toggle('is-selected', li.dataset.value === select.value);
    });
  },

  _pick(wrap, value) {
    wrap._select.value = value;
    wrap._select.dispatchEvent(new Event('change', { bubbles: true }));
    this._close(wrap);
    wrap._trigger.focus();
  },

  _toggle(wrap) {
    if (this._openWrap && this._openWrap !== wrap) {
      this._close(this._openWrap);
    }
    if (wrap._menu.classList.contains('is-open')) {
      this._close(wrap);
      return;
    }
    this._open(wrap);
  },

  _open(wrap) {
    const menu = wrap._menu;
    // Portal: move o menu para o body para escapar de transform/overflow do modal
    document.body.appendChild(menu);
    wrap.classList.add('is-open');
    wrap._trigger.setAttribute('aria-expanded', 'true');
    this._openWrap = wrap;

    this._positionMenu(wrap);
    requestAnimationFrame(() => menu.classList.add('is-open'));

    this._reposition = () => this._positionMenu(wrap);
    window.addEventListener('scroll', this._reposition, true);
    window.addEventListener('resize', this._reposition);
  },

  // Posicionamento idêntico para todos os dropdowns: fixed, ancorado ao gatilho.
  _positionMenu(wrap) {
    const menu = wrap._menu;
    const rect = wrap._trigger.getBoundingClientRect();
    const menuHeight = Math.min(menu.scrollHeight || 220, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const flip = spaceBelow < menuHeight + 16 && rect.top > spaceBelow;

    menu.style.position = 'fixed';
    menu.style.left = `${rect.left}px`;
    menu.style.right = 'auto';

    // Largura: pelo menos a do gatilho, expandindo para caber os rótulos completos
    menu.style.width = 'max-content';
    menu.style.minWidth = `${rect.width}px`;
    menu.style.maxWidth = `${Math.min(window.innerWidth - rect.left - 16, 320)}px`;
    const measuredWidth = menu.offsetWidth;
    menu.style.width = `${measuredWidth}px`;
    menu.style.minWidth = '';
    menu.style.maxWidth = '';

    if (flip) {
      menu.style.top = 'auto';
      menu.style.bottom = `${window.innerHeight - rect.top + 6}px`;
      menu.classList.add('is-flip');
    } else {
      menu.style.bottom = 'auto';
      menu.style.top = `${rect.bottom + 6}px`;
      menu.classList.remove('is-flip');
    }
  },

  _close(wrap) {
    if (!wrap) return;
    const menu = wrap._menu;
    wrap.classList.remove('is-open');
    menu.classList.remove('is-open');
    wrap._trigger.setAttribute('aria-expanded', 'false');

    if (this._reposition) {
      window.removeEventListener('scroll', this._reposition, true);
      window.removeEventListener('resize', this._reposition);
      this._reposition = null;
    }
    if (this._openWrap === wrap) this._openWrap = null;

    // Após a transição, devolve o menu ao wrap e limpa estilos inline
    setTimeout(() => {
      if (menu.classList.contains('is-open')) return; // reaberto nesse meio tempo
      menu.classList.remove('is-flip');
      menu.removeAttribute('style');
      if (menu.parentElement !== wrap) {
        wrap.appendChild(menu);
      }
    }, 180);
  },

  _bindGlobalClose() {
    if (this._globalBound) return;
    this._globalBound = true;
    document.addEventListener('click', () => {
      if (this._openWrap) this._close(this._openWrap);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._openWrap) this._close(this._openWrap);
    });
  },

  _onTriggerKey(e, wrap) {
    const menu = wrap._menu;
    const options = [...menu.querySelectorAll('.custom-select__option')];
    let idx = options.findIndex((o) => o.classList.contains('is-focused'));
    if (idx < 0) idx = options.findIndex((o) => o.classList.contains('is-selected'));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!menu.classList.contains('is-open')) this._open(wrap);
      options.forEach((o) => o.classList.remove('is-focused'));
      if (e.key === 'ArrowDown') idx = Math.min(idx + 1, options.length - 1);
      else idx = Math.max(idx - 1, 0);
      options[idx]?.classList.add('is-focused');
      options[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!menu.classList.contains('is-open')) {
        this._open(wrap);
      } else if (options[idx]) {
        this._pick(wrap, options[idx].dataset.value);
      }
    } else if (e.key === 'Escape') {
      this._close(wrap);
    }
  },

  /** Reconstrói após innerHTML dos selects */
  refresh(selectEl) {
    if (selectEl && selectEl._customSyncOptions) {
      selectEl._customSyncOptions();
      return;
    }
    this.enhance(selectEl?.parentElement || document);
  },
};
