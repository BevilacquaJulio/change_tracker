// === UI Lightbox — evidência em tela cheia com zoom (scroll e botões) ===

const UILightbox = {
  _overlay: null,
  _stage: null,
  _wrap: null,
  _img: null,
  _zoomLabel: null,
  _titleEl: null,
  _hintEl: null,
  _prevBtn: null,
  _nextBtn: null,
  _images: [],
  _index: 0,
  _scale: 1,
  _minScale: 0.25,
  _maxScale: 4,
  _step: 0.2,
  _panX: 0,
  _panY: 0,
  _drag: null,

  init() {
    this._overlay = document.getElementById('lightbox-overlay');
    this._stage = document.getElementById('lightbox-stage');
    this._wrap = document.getElementById('lightbox-img-wrap');
    this._img = document.getElementById('lightbox-img');
    this._zoomLabel = document.getElementById('lightbox-zoom-label');
    this._titleEl = document.getElementById('lightbox-title');
    this._hintEl = document.getElementById('lightbox-hint');
    this._prevBtn = document.getElementById('lightbox-prev');
    this._nextBtn = document.getElementById('lightbox-next');

    document.getElementById('lightbox-close').addEventListener('click', () => this.close());
    document.getElementById('lightbox-zoom-in').addEventListener('click', () => this.zoomBy(this._step));
    document.getElementById('lightbox-zoom-out').addEventListener('click', () => this.zoomBy(-this._step));
    document.getElementById('lightbox-zoom-reset').addEventListener('click', () => this.resetView());
    this._prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });
    this._nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });

    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    this._stage.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });

    this._stage.addEventListener('mousedown', (e) => this._onDragStart(e));
    window.addEventListener('mousemove', (e) => this._onDragMove(e));
    window.addEventListener('mouseup', () => this._onDragEnd());

    this._stage.addEventListener('touchstart', (e) => this._onDragStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this._onDragMove(e), { passive: false });
    window.addEventListener('touchend', () => this._onDragEnd());

    document.addEventListener('keydown', (e) => {
      if (!this._isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.zoomBy(this._step);
      }
      if (e.key === '-') {
        e.preventDefault();
        this.zoomBy(-this._step);
      }
      if (e.key === '0') this.resetView();
    });
  },

  _isOpen() {
    return this._overlay?.classList.contains('modal-overlay--open');
  },

  open(src, alt = 'Evidência') {
    this.openGallery([src], 0, alt);
  },

  openGallery(images, startIndex = 0, altPrefix = 'Evidência') {
    this._images = (images || []).filter(Boolean);
    if (!this._images.length) return;
    this._altPrefix = altPrefix;
    this._index = Math.max(0, Math.min(startIndex, this._images.length - 1));
    this._showSlide();

    this._overlay.classList.add('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [this._overlay] });
    requestAnimationFrame(() => document.getElementById('lightbox-close')?.focus({ preventScroll: true }));
  },

  _showSlide() {
    const src = this._images[this._index];
    this._img.src = src;
    const multi = this._images.length > 1;
    const label = multi
      ? `${this._altPrefix} (${this._index + 1} de ${this._images.length})`
      : this._altPrefix;
    this._img.alt = label;
    if (this._titleEl) this._titleEl.textContent = label;
    this._prevBtn?.classList.toggle('hidden', !multi);
    this._nextBtn?.classList.toggle('hidden', !multi);
    if (this._hintEl) {
      this._hintEl.textContent = multi
        ? 'Scroll ou botões para zoom · ← → para trocar imagem · Esc para fechar'
        : 'Scroll do mouse ou botões para zoom · Arraste para mover quando ampliado · Esc para fechar';
    }
    this.resetView();
  },

  prev() {
    if (this._images.length < 2) return;
    this._index = (this._index - 1 + this._images.length) % this._images.length;
    this._showSlide();
  },

  next() {
    if (this._images.length < 2) return;
    this._index = (this._index + 1) % this._images.length;
    this._showSlide();
  },

  close() {
    this._onDragEnd();
    this._overlay.classList.remove('modal-overlay--open');
    this._overlay.setAttribute('aria-hidden', 'true');
    if (
      !document.getElementById('modal-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('detail-overlay').classList.contains('modal-overlay--open') &&
      !document.getElementById('confirm-overlay').classList.contains('modal-overlay--open')
    ) {
      document.body.classList.remove('modal-open');
    }
    this._img.removeAttribute('src');
    this._images = [];
    this._index = 0;
    this.resetView();
  },

  resetView() {
    this._scale = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyTransform();
  },

  zoomBy(delta) {
    this._scale = Math.min(this._maxScale, Math.max(this._minScale, +(this._scale + delta).toFixed(2)));
    if (this._scale <= 1) {
      this._panX = 0;
      this._panY = 0;
    }
    this._applyTransform();
  },

  _applyTransform() {
    this._wrap.style.transform = `translate(${this._panX}px, ${this._panY}px) scale(${this._scale})`;
    if (this._zoomLabel) this._zoomLabel.textContent = `${Math.round(this._scale * 100)}%`;
    this._stage.classList.toggle('is-zoomed', this._scale > 1);
  },

  _onWheel(e) {
    if (!this._isOpen()) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -this._step : this._step;
    this._wrap.classList.add('no-transition');
    this.zoomBy(delta);
    requestAnimationFrame(() => this._wrap.classList.remove('no-transition'));
  },

  _pointer(e) {
    if (e.touches?.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  },

  _onDragStart(e) {
    if (e.target.closest('.lightbox__gallery-nav')) return;
    if (this._scale <= 1) return;
    if (e.type === 'mousedown' && e.button !== 0) return;
    const target = e.target;
    if (target !== this._stage && target !== this._wrap && target !== this._img) return;
    e.preventDefault();
    const p = this._pointer(e);
    this._drag = { x: p.x, y: p.y, panX: this._panX, panY: this._panY };
    this._stage.classList.add('is-dragging');
    this._wrap.classList.add('no-transition');
  },

  _onDragMove(e) {
    if (!this._drag) return;
    e.preventDefault();
    const p = this._pointer(e);
    this._panX = this._drag.panX + (p.x - this._drag.x);
    this._panY = this._drag.panY + (p.y - this._drag.y);
    this._applyTransform();
  },

  _onDragEnd() {
    if (!this._drag) return;
    this._drag = null;
    this._stage.classList.remove('is-dragging');
    this._wrap.classList.remove('no-transition');
  },
};
