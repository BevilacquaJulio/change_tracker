// === UI Evidence — carrossel de imagens (modal, detalhe e lightbox) ===

const UIEvidence = {
  getImages(source) {
    const raw = source && typeof source === 'object' && !Array.isArray(source) ? source.evidence : source;
    return Model.normalizeEvidence(raw).filter((src) => Model.isImageEvidence(src));
  },

  renderCarousel(images, { openAction = 'open-lightbox' } = {}) {
    if (!images.length) return '';
    const single = images.length === 1;

    const slides = images
      .map(
        (src, i) => `
      <div class="evidence-carousel__slide${i === 0 ? ' is-active' : ''}" data-index="${i}">
        <button type="button" class="detail-evidence-box detail-evidence-box--interactive evidence-carousel__trigger"
          data-action="${openAction}" data-src="${UIList.escapeHtml(src)}" data-index="${i}"
          title="Clique para ampliar">
          <img src="${UIList.escapeHtml(src)}" alt="Evidência ${i + 1} de ${images.length}" loading="lazy" draggable="false" />
          <span class="detail-evidence-box__hint"><i data-lucide="expand"></i> Clique para ampliar</span>
        </button>
      </div>`
      )
      .join('');

    const nav = single
      ? ''
      : `
      <button type="button" class="evidence-carousel__nav evidence-carousel__nav--prev" data-action="carousel-prev" aria-label="Imagem anterior">
        <i data-lucide="chevron-left"></i>
      </button>
      <button type="button" class="evidence-carousel__nav evidence-carousel__nav--next" data-action="carousel-next" aria-label="Próxima imagem">
        <i data-lucide="chevron-right"></i>
      </button>`;

    const dots = single
      ? ''
      : `<div class="evidence-carousel__dots" role="tablist" aria-label="Selecionar imagem">
        ${images.map((_, i) => `<button type="button" class="evidence-carousel__dot${i === 0 ? ' is-active' : ''}" data-action="carousel-goto" data-index="${i}" role="tab" aria-label="Imagem ${i + 1}" aria-selected="${i === 0 ? 'true' : 'false'}"></button>`).join('')}
      </div>`;

    const counter = single
      ? ''
      : `<span class="evidence-carousel__counter" aria-live="polite">1 / ${images.length}</span>`;

    return `
      <div class="evidence-carousel${single ? ' evidence-carousel--single' : ''}" data-evidence-carousel data-current-index="0">
        ${nav}
        <div class="evidence-carousel__viewport">
          <div class="evidence-carousel__track">${slides}</div>
        </div>
        ${dots}
        ${counter}
      </div>`;
  },

  goTo(carousel, index) {
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll('.evidence-carousel__slide')];
    if (!slides.length) return;
    const i = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));
    carousel.querySelectorAll('.evidence-carousel__dot').forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
    const counter = carousel.querySelector('.evidence-carousel__counter');
    if (counter) counter.textContent = `${i + 1} / ${slides.length}`;
    carousel.dataset.currentIndex = String(i);
    return i;
  },

  getImagesFromCarousel(carousel) {
    return [...carousel.querySelectorAll('.evidence-carousel__trigger[data-src]')]
      .map((el) => el.dataset.src)
      .filter(Boolean);
  },

  bindCarousel(root, { onLightbox, lightboxAction = 'open-lightbox' } = {}) {
    const carousel = root.matches?.('[data-evidence-carousel]')
      ? root
      : root.querySelector('[data-evidence-carousel]');
    if (!carousel || carousel.dataset.bound === '1') return carousel;
    carousel.dataset.bound = '1';

    carousel.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target || !carousel.contains(target)) return;

      const action = target.dataset.action;
      const current = parseInt(carousel.dataset.currentIndex || '0', 10);

      if (action === 'carousel-prev') {
        e.preventDefault();
        this.goTo(carousel, current - 1);
        return;
      }
      if (action === 'carousel-next') {
        e.preventDefault();
        this.goTo(carousel, current + 1);
        return;
      }
      if (action === 'carousel-goto') {
        e.preventDefault();
        this.goTo(carousel, parseInt(target.dataset.index, 10));
        return;
      }
      if (action === lightboxAction || action === 'open-lightbox' || action === 'open-lightbox-modal') {
        e.preventDefault();
        const images = this.getImagesFromCarousel(carousel);
        const index = parseInt(target.dataset.index ?? carousel.dataset.currentIndex ?? '0', 10);
        if (onLightbox) onLightbox(images, index);
        else UILightbox.openGallery(images, index);
      }
    });

    return carousel;
  },

  renderBlock(itemOrEvidence, { openAction = 'open-lightbox' } = {}) {
    const images = this.getImages(itemOrEvidence);
    if (!images.length) {
      const raw = typeof itemOrEvidence === 'object' ? itemOrEvidence?.evidence : itemOrEvidence;
      const links = Model.normalizeEvidence(raw);
      if (links.length && !images.length) {
        return `<div class="detail-view__value"><a href="${UIList.escapeHtml(links[0])}" target="_blank" rel="noopener noreferrer">${UIList.escapeHtml(links[0])}</a></div>`;
      }
      return '';
    }
    return `<div class="evidence-carousel-host">${this.renderCarousel(images, { openAction })}</div>`;
  },
};
