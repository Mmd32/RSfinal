/* Retail Solutions — renders the page from content/content.json
   Edit content through /admin (or the JSON file); this file only defines layout. */
(function () {
  'use strict';

  const CONTENT_URL = 'content/content.json';

  /* ---------- helpers ---------- */
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Typographic hygiene:
  // 1. Keep Persian conjunction «و» glued to the next word (never dangling at the end of a line)
  // 2. Prevent orphan/widow single words at line ends in headings by binding the last space with NBSP
  const typo = (str, isHeading = false) => {
    if (str == null) return '';
    let s = String(str);
    s = s.replace(/(^|[\s،؛«\(\[])(و)\s+/g, '$1$2\u00A0');
    if (isHeading) {
      s = s.replace(/\s+([^\s]+)$/, '\u00A0$1');
    }
    return s;
  };

  // **bold** and line breaks are the only formatting allowed in text fields
  const rich = (s, isHeading = false) => typo(esc(s), isHeading).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const heading = s => rich(s, true);

  // only allow safe link schemes
  const url = u => {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u)) return esc(u);
    return '#';
  };
  const bg = u => u ? `background-image:url('${esc(String(u).replace(/'/g, '%27'))}')` : '';
  const isExternal = u => /^https?:/i.test(u || '');
  const target = u => isExternal(u) ? ' target="_blank" rel="noopener"' : '';
  const faDigits = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const pad2 = n => faDigits(String(n).padStart(2, '0'));
  const arrow = '<span class="arrow">←</span>';
  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 9l7 7 7-7"/></svg>';
  const $ = (sel, root = document) => root.querySelector(sel);

  /* =========================================================
     Typography — fonts, global sizes and per-text styles
     (admin → «تایپوگرافی» and the «Aa» button next to each text field)
     ========================================================= */
  const FONTS = {
    lahzeh: { css: '"Lahzeh"' },
    vazirmatn: { css: '"Vazirmatn"', google: 'Vazirmatn:wght@300;400;500;600;700;800' },
    iransans: { css: '"IRANSansX"' },                                         // local files (assets/fonts)
    'noto-kufi': { css: '"Noto Kufi Arabic"', google: 'Noto+Kufi+Arabic:wght@300;400;500;600;700;800' },
    'noto-naskh': { css: '"Noto Naskh Arabic"', google: 'Noto+Naskh+Arabic:wght@400;500;600;700' },
    lalezar: { css: '"Lalezar"', google: 'Lalezar' }
  };
  const FALLBACK = ', "Lahzeh", "Vazirmatn", Tahoma, sans-serif';
  const fontStack = key => FONTS[key] ? FONTS[key].css + FALLBACK : '';

  // style attribute for one text: o._style[key] = {font, size(%), weight, color, align}
  function sa(o, key, extra = '') {
    const s = o && o._style && o._style[key];
    let css = extra, fx = '';
    if (s) {
      if (FONTS[s.font]) css += `font-family:${fontStack(s.font)};`;
      if (/^[1-9]00$/.test(String(s.weight))) css += `font-weight:${s.weight};`;
      if (/^#[0-9a-f]{3,8}$/i.test(s.color || '')) css += `color:${s.color};`;
      if (['right', 'center', 'left', 'justify'].includes(s.align)) css += `text-align:${s.align};`;
      const size = Number(s.size);
      if (size && size !== 100 && size >= 40 && size <= 300) fx = ` data-fx="${size / 100}"`;
    }
    return (css ? ` style="${esc(css)}"` : '') + fx;
  }

  function applyTypography(c) {
    const t = c.typography || {}, root = document.documentElement.style;
    const pct = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 100)) / 100;
    if (FONTS[t.fontBody]) root.setProperty('--font', fontStack(t.fontBody));
    root.setProperty('--font-head', FONTS[t.fontHeading] ? fontStack(t.fontHeading) : 'var(--font)');
    root.setProperty('--ts', pct(t.scale, 70, 150));
    root.setProperty('--ts-head', pct(t.headingScale, 60, 160));
    root.setProperty('--ts-body', pct(t.bodyScale, 70, 150));
    // load only the Google fonts that are actually used
    const used = new Set([t.fontBody, t.fontHeading]);
    (function scan(o) {
      if (!o || typeof o !== 'object') return;
      if (o._style) Object.values(o._style).forEach(s => s && used.add(s.font));
      Object.values(o).forEach(scan);
    })(c);
    const fams = [...used].filter(k => FONTS[k] && FONTS[k].google && k !== 'vazirmatn').map(k => 'family=' + FONTS[k].google);
    if (fams.length && !document.getElementById('rs-fonts')) {
      const l = document.createElement('link');
      l.id = 'rs-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&display=swap';
      document.head.appendChild(l);
    }
  }

  // per-text size: multiply the element's own CSS size (recomputed on resize because sizes are responsive)
  function applySizes() {
    const els = [...document.querySelectorAll('[data-fx]')];
    els.forEach(el => { el.style.fontSize = ''; });
    els.forEach(el => {
      const base = parseFloat(getComputedStyle(el).fontSize);
      if (base) el.style.fontSize = (base * Number(el.dataset.fx)) + 'px';
    });
  }
  let sizeTimer;
  window.addEventListener('resize', () => { clearTimeout(sizeTimer); sizeTimer = setTimeout(applySizes, 150); });

  /* ---------- section renderers ---------- */
  function renderHeader(c) {
    const s = c.site, n = c.nav;
    $('#site-header').innerHTML = `
      <div class="container">
        <a class="site-logo" href="${url(s.homeUrl || '#')}" aria-label="${esc(s.logoAlt)}"><img src="${esc(s.logo)}" alt="${esc(s.logoAlt)}"></a>
        <button class="menu-toggle" aria-expanded="false" aria-controls="main-nav"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z"/></svg>منو</button>
        <nav class="main-nav" id="main-nav"><ul>
          ${(n.items || []).map(item => {
            const kids = (item.children || []).filter(k => k.label);
            return `<li${kids.length ? ' class="has-sub"' : ''}>
              <a href="${url(item.url)}"${target(item.url)}${sa(item, 'label')}>${esc(item.label)}${kids.length ? ' ' + chev : ''}</a>
              ${kids.length ? `<ul class="sub-menu">${kids.map(k =>
                `<li><a href="${url(k.url)}"${target(k.url)}${sa(k, 'label')}>${k.tag ? `<span class="latin">${esc(k.tag)}</span>` : ''}${esc(k.label)}</a></li>`).join('')}</ul>` : ''}
            </li>`;
          }).join('')}
          ${n.langLabel ? `<li class="lang"><a href="${url(n.langUrl)}"${sa(n, 'langLabel')}>${esc(n.langLabel)}</a></li>` : ''}
        </ul></nav>
      </div>`;
  }

  function renderHero(c) {
    const h = c.hero, slides = (h.slides || []).filter(s => s.image || s.title);
    const el = $('#hero');
    const style = h.style === 'overlay' ? 'overlay' : 'split';
    el.className = 'hero hero--' + style;
    if (h.panelWidth) el.style.setProperty('--panel', Math.min(60, Math.max(34, Number(h.panelWidth) || 44)) + '%');
    const total = pad2(slides.length);
    // body text: blank line = new paragraph, single line break kept
    const paras = t => String(t || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${rich(p)}</p>`).join('');
    el.innerHTML = slides.map((s, i) => `
      <div class="hero-slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}" role="group" aria-label="اسلاید ${faDigits(i + 1)}">
        <div class="hero-panel">
          <div class="hero-content">
            ${slides.length > 1 ? `<div class="hero-count"><b>${pad2(i + 1)}</b><span>/ ${total}</span></div>` : ''}
            ${s.eyebrow ? `<span class="eyebrow"${sa(s, 'eyebrow')}>${esc(s.eyebrow)}</span>` : ''}
            ${i === 0 ? `<h1${sa(s, 'title')}>${heading(s.title)}</h1>` : `<h2 class="h1-like"${sa(s, 'title')}>${heading(s.title)}</h2>`}
            ${s.text ? `<div class="hero-text"${sa(s, 'text')}>${paras(s.text)}</div>` : ''}
            ${s.buttonLabel ? `<div><a class="btn btn-primary" href="${url(s.buttonUrl)}"${target(s.buttonUrl)}${sa(s, 'buttonLabel')}>${esc(s.buttonLabel)} ${arrow}</a></div>` : ''}
          </div>
        </div>
        <div class="hero-media"><div class="hero-bg" style="${bg(s.image)};background-position:${['center', 'top', 'bottom', 'right', 'left'].includes(s.imagePosition) ? s.imagePosition : 'center'}" role="img" aria-label="${esc(s.imageAlt || '')}"></div></div>
      </div>`).join('') + `
      <div class="hero-controls">
        <div class="hero-dots">${slides.map((_, i) => `<button class="hero-dot${i === 0 ? ' is-active' : ''}" aria-label="اسلاید ${faDigits(i + 1)}"><span></span></button>`).join('')}</div>
        <div class="hero-arrows">
          <button class="hero-arrow hero-prev" aria-label="اسلاید قبلی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg></button>
          <button class="hero-arrow hero-next" aria-label="اسلاید بعدی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 5l-7 7 7 7"/></svg></button>
        </div>
      </div>`;
    initHeroSlider(el, h);
  }

  function renderAbout(c) {
    const a = c.about, cta = a.cta || {};
    const hasCta = Boolean((cta.title && cta.title.trim()) || (cta.primaryLabel && cta.primaryLabel.trim()));
    $('#about').innerHTML = `
      <div class="container${hasCta ? '' : ' story--single'}">
        <div class="story-content">
          ${a.eyebrow ? `<span class="eyebrow"${sa(a, 'eyebrow')}>${esc(a.eyebrow)}</span>` : ''}
          <h2${sa(a, 'title')}>${heading(a.title || '')} ${a.titleHighlight ? `<em${sa(a, 'titleHighlight')}>${esc(a.titleHighlight)}</em>` : ''}</h2>
          ${(a.paragraphs || []).filter(Boolean).map(p => `<p class="lead"${sa(a, 'paragraphs')}>${rich(p)}</p>`).join('')}
          ${(a.stats || []).length ? `<div class="stats">${a.stats.map(s => `<div class="stat"><b${sa(s, 'value')}>${esc(s.value)}</b><span${sa(s, 'label')}>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
        </div>
        ${hasCta ? `<aside class="cta-box">
          ${cta.eyebrow ? `<span class="eyebrow"${sa(cta, 'eyebrow')}>${esc(cta.eyebrow)}</span>` : ''}
          <h3${sa(cta, 'title')}>${heading(cta.title)}</h3>
          <p${sa(cta, 'text')}>${rich(cta.text)}</p>
          <div class="btn-group">
            ${cta.primaryLabel ? `<a class="btn btn-primary" href="${url(cta.primaryUrl)}"${target(cta.primaryUrl)}${sa(cta, 'primaryLabel')}>${esc(cta.primaryLabel)} ${arrow}</a>` : ''}
            ${cta.secondaryLabel ? `<a class="btn btn-outline" href="${url(cta.secondaryUrl)}"${target(cta.secondaryUrl)}${sa(cta, 'secondaryLabel')}>${esc(cta.secondaryLabel)}</a>` : ''}
          </div>
        </aside>` : ''}
      </div>`;
  }

  function renderServices(c) {
    const s = c.services, cards = s.cards || [];
    $('#services').innerHTML = `
      <div class="container">
        <div>
          ${s.eyebrow ? `<span class="eyebrow"${sa(s, 'eyebrow')}>${esc(s.eyebrow)}</span>` : ''}
          <h2${sa(s, 'title')}>${heading(s.title)}</h2>
        </div>
        <div>
          <p class="lead"${sa(s, 'text')}>${rich(s.text)}</p>
          ${s.buttonLabel ? `<a class="btn btn-outline" href="${url(s.buttonUrl)}"${target(s.buttonUrl)}${sa(s, 'buttonLabel')}>${esc(s.buttonLabel)} ${arrow}</a>` : ''}
        </div>
      </div>`;
    const card = (k, cls) => k ? `
      <article class="card ${cls} bg-img" style="${bg(k.image)}">
        <a class="card-link" href="${url(k.url)}"${target(k.url)} aria-label="${esc(k.title)}"></a>
        ${k.tag ? `<span class="eyebrow"${sa(k, 'tag')}>${esc(k.tag)}</span>` : ''}
        <h3${sa(k, 'title')}>${heading(k.title)}</h3>
        ${k.text ? `<p${sa(k, 'text')}>${rich(k.text)}</p>` : ''}
        ${s.moreLabel ? `<span class="more"${sa(s, 'moreLabel')}>${esc(s.moreLabel)} ${arrow}</span>` : ''}
      </article>` : '';
    $('#services-grid').innerHTML = `
      <div class="container">
        <div class="services-grid">
          <div class="services-left">${card(cards[0], '')}${card(cards[1], '')}${card(cards[2], 'card-wide')}</div>
          ${card(cards[3], 'card-tall')}
        </div>
      </div>`;
  }

  function renderPains(c) {
    const p = c.pains;
    $('#pains').innerHTML = `
      <div class="container">
        <div class="pains-media bg-img" style="${bg(p.image)}"></div>
        <div>
          ${p.eyebrow ? `<span class="eyebrow"${sa(p, 'eyebrow')}>${esc(p.eyebrow)}</span>` : ''}
          <h2${sa(p, 'title')}>${heading(p.title)}</h2>
          ${p.text ? `<p class="lead"${sa(p, 'text')}>${rich(p.text)}</p>` : ''}
          <ul class="pain-list">${(p.items || []).filter(Boolean).map((t, i) =>
            `<li class="pain-item"><span class="num">${pad2(i + 1)}</span><h4${sa(p, 'items')}>${heading(t)}</h4></li>`).join('')}</ul>
          ${p.closing ? `<p class="pains-close"${sa(p, 'closing')}>${rich(p.closing)}</p>` : ''}
        </div>
      </div>`;
  }

  function renderDifference(c) {
    const d = c.difference;
    $('#difference').innerHTML = `
      <div class="container">
        <div>
          ${d.eyebrow ? `<span class="eyebrow"${sa(d, 'eyebrow')}>${esc(d.eyebrow)}</span>` : ''}
          <h2${sa(d, 'title')}>${heading(d.title)}</h2>
          <p class="lead"${sa(d, 'text')}>${rich(d.text)}</p>
          ${d.buttonLabel ? `<a class="btn btn-light" href="${url(d.buttonUrl)}"${target(d.buttonUrl)}${sa(d, 'buttonLabel')}>${esc(d.buttonLabel)} ${arrow}</a>` : ''}
        </div>
        <div class="video" data-video="${esc(d.videoUrl || '')}">
          <div class="bg-img" style="${bg(d.videoImage)}"></div>
          ${d.videoUrl ? '<button class="video-play" aria-label="پخش ویدیو"></button>' : ''}
        </div>
      </div>`;
    const v = $('#difference .video');
    const btn = $('.video-play', v);
    if (btn) btn.addEventListener('click', () => {
      const src = toEmbed(v.dataset.video);
      if (!src) return;
      v.insertAdjacentHTML('beforeend', `<iframe src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`);
      btn.remove();
    });
  }

  // YouTube / Aparat links → embeddable URLs
  function toEmbed(u) {
    u = String(u || '').trim();
    let m;
    if ((m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/))) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
    if ((m = u.match(/aparat\.com\/v\/([\w-]+)/))) return `https://www.aparat.com/video/video/embed/videohash/${m[1]}/vt/frame?autoplay=true`;
    return /^https:\/\//i.test(u) ? u : '';
  }

  function renderSolutions(c) {
    const s = c.solutions, t = s.tiles || [];
    const tile = (k, cls) => k ? `
      <a class="tile ${cls}" href="${url(k.url)}"${target(k.url)}>
        <div class="tile-image bg-img" style="${bg(k.image)}"></div>
        <div class="tile-text">${k.tag ? `<span class="eyebrow"${sa(k, 'tag')}>${esc(k.tag)}</span>` : ''}<h3 class="tile-title"${sa(k, 'title')}>${heading(k.title)}</h3></div>
      </a>` : '';
    $('#solutions').innerHTML = `
      <div class="container">
        <div class="section-head">
          <div>
            ${s.eyebrow ? `<span class="eyebrow"${sa(s, 'eyebrow')}>${esc(s.eyebrow)}</span>` : ''}
            <h2${sa(s, 'title')}>${heading(s.title)}</h2>
          </div>
          ${s.linkLabel ? `<a class="link" href="${url(s.linkUrl)}"${target(s.linkUrl)}${sa(s, 'linkLabel')}>${esc(s.linkLabel)} <span>←</span></a>` : ''}
        </div>
        <div class="tiles-grid">${tile(t[0], 'tile-lg')}${tile(t[1], 'tile-md')}${tile(t[2], '')}${tile(t[3], '')}</div>
      </div>`;
  }

  function renderIndustries(c) {
    const ind = c.industries;
    $('#industries').innerHTML = `
      <div class="container">
        ${ind.eyebrow ? `<span class="eyebrow"${sa(ind, 'eyebrow')}>${esc(ind.eyebrow)}</span>` : ''}
        <div class="logo-carousel">
          <div class="logo-viewport"><div class="logo-track"></div></div>
          <button class="logo-nav logo-prev" aria-label="قبلی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg></button>
          <button class="logo-nav logo-next" aria-label="بعدی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 5l-7 7 7 7"/></svg></button>
        </div>
      </div>`;
    initCarousel((ind.items || []).filter(Boolean), sa(ind, 'items'));
  }

  function renderFooter(c) {
    const f = c.footer, s = c.site;
    const icons = {
      linkedin: '<svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
      email: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>'
    };
    const social = [
      f.linkedin && `<a href="${url(f.linkedin)}" target="_blank" rel="noopener" aria-label="لینکدین">${icons.linkedin}</a>`,
      f.instagram && `<a href="${url(f.instagram)}" target="_blank" rel="noopener" aria-label="اینستاگرام">${icons.instagram}</a>`,
      f.email && `<a href="mailto:${esc(f.email)}" aria-label="ایمیل">${icons.email}</a>`
    ].filter(Boolean).join('');
    const year = new Date().getFullYear().toLocaleString('fa-IR', { useGrouping: false });
    $('#contact').innerHTML = `
      <div class="footer-main bg-brand">
        <div class="container footer-grid">
          <div class="footer-logo"><img src="${esc(s.logoFooter)}" alt="${esc(s.logoAlt)}"></div>
          <div>${f.brandTitle ? `<h4${sa(f, 'brandTitle')}>${heading(f.brandTitle)}</h4>` : ''}<p class="tagline"${sa(f, 'tagline')}>${heading(f.tagline)}</p></div>
          <div><h4${sa(f, 'linksTitle')}>${heading(f.linksTitle)}</h4><ul>${(f.links || []).map(l => `<li><a href="${url(l.url)}"${target(l.url)}${sa(l, 'label')}>${esc(l.label)}</a></li>`).join('')}</ul></div>
          <div>
            <h4${sa(f, 'contactTitle')}>${heading(f.contactTitle)}</h4>
            ${f.email ? `<p><a href="mailto:${esc(f.email)}" class="latin">${esc(f.email)}</a></p>` : ''}
            ${f.phone ? `<p><a href="tel:${esc(f.phone.replace(/[^\d+]/g, ''))}" class="latin">${esc(f.phone)}</a></p>` : ''}
            ${social ? `<div class="social" style="margin-top:16px">${social}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container">
          <p><span${sa(f, 'copyright')}>${esc(f.copyright)} ${year}</span>${f.poweredBy ? ` — <span class="latin"${sa(f, 'poweredBy')}>${esc(f.poweredBy)}</span>` : ''}</p>
          <nav class="footer-links">${(f.legal || []).map(l => `<a href="${url(l.url)}"${target(l.url)}${sa(l, 'label')}>${esc(l.label)}</a>`).join('')}</nav>
        </div>
      </div>`;
  }

  /* ---------- behaviours ---------- */
  function initHeroSlider(el, opts) {
    const slides = [...el.querySelectorAll('.hero-slide')];
    const dots = [...el.querySelectorAll('.hero-dot')];
    if (slides.length < 2) { el.classList.add('single'); return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const interval = Math.max(2, Number(opts.interval) || 6) * 1000;
    const autoplay = opts.autoplay !== false && !reduced;
    el.style.setProperty('--hero-interval', interval + 'ms');
    if (!autoplay) el.classList.add('no-autoplay');
    let i = 0, timer = null;

    // preload the other slide images
    slides.forEach(s => { const m = (s.querySelector('.hero-bg').style.backgroundImage || '').match(/url\(["']?(.+?)["']?\)/); if (m) new Image().src = m[1]; });

    function go(n) {
      slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden', 'true');
      dots[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); slides[i].setAttribute('aria-hidden', 'false');
      // restart progress animation
      dots[i].classList.remove('is-active'); void dots[i].offsetWidth; dots[i].classList.add('is-active');
      // scrollable tab bar (products slider on mobile): bring the active tab into view, only while the slider is on screen
      const bar = dots[i].parentElement, r = el.getBoundingClientRect();
      if (bar.scrollWidth > bar.clientWidth && r.top < innerHeight && r.bottom > 0)
        dots[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      restart();
    }
    function restart() { clearTimeout(timer); if (autoplay && !el.classList.contains('is-paused')) timer = setTimeout(() => go(i + 1), interval); }

    el.querySelector('.hero-next').addEventListener('click', () => go(i + 1));
    el.querySelector('.hero-prev').addEventListener('click', () => go(i - 1));
    dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
    el.addEventListener('mouseenter', () => { el.classList.add('is-paused'); clearTimeout(timer); });
    el.addEventListener('mouseleave', () => { el.classList.remove('is-paused'); go(i); });
    document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : restart());
    document.addEventListener('keydown', e => {
      // only the slider that is on screen reacts (the page may have more than one)
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowLeft') go(i + 1);   // RTL: left = next
      if (e.key === 'ArrowRight') go(i - 1);
    });
    let x0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(dx > 0 ? i + 1 : i - 1);
    });
    restart();
  }

  function initCarousel(items, boxAttr = '') {
    const track = document.querySelector('.logo-track');
    if (!track || !items.length) return;
    const list = items.concat(items);
    track.innerHTML = list.map(name => `<div class="logo-item"><div class="logo-box"${boxAttr}>${esc(name)}</div></div>`).join('');
    const count = list.length;
    let index = 0;
    const perView = () => { const w = window.innerWidth; return w <= 560 ? 2 : w <= 900 ? 3 : w <= 1100 ? 4 : 6; };
    function layout() {
      const vp = track.parentElement.clientWidth, pv = perView();
      track.querySelectorAll('.logo-item').forEach(el => el.style.width = (vp / pv) + 'px');
      index = Math.max(0, Math.min(index, count - pv));
      track.style.transform = 'translateX(' + (-index * vp / pv) + 'px)';
    }
    function go(dir) {
      const max = Math.max(0, count - perView());
      index += dir;
      if (index > max) index = 0;
      if (index < 0) index = max;
      layout();
    }
    document.querySelector('.logo-next').addEventListener('click', () => go(1));
    document.querySelector('.logo-prev').addEventListener('click', () => go(-1));
    window.addEventListener('resize', layout);
    layout();
    let timer = setInterval(() => go(1), 3000);
    const car = document.querySelector('.logo-carousel');
    car.addEventListener('mouseenter', () => clearInterval(timer));
    car.addEventListener('mouseleave', () => { clearInterval(timer); timer = setInterval(() => go(1), 3000); });
  }

  function initHeader() {
    const header = $('#site-header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const nav = $('#main-nav'), toggle = $('.menu-toggle');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('toggled');
      toggle.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.has-sub > a').forEach(a => a.addEventListener('click', e => {
      if (window.innerWidth <= 900) { e.preventDefault(); a.parentElement.classList.toggle('open'); }
    }));
    // close mobile menu after choosing an in-page link
    nav.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a && a.getAttribute('href').startsWith('#') && !a.parentElement.classList.contains('has-sub')) {
        nav.classList.remove('toggled'); toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* =========================================================
     Inner pages
     ========================================================= */
  const qsId = () => new URLSearchParams(location.search).get('id') || '';
  const list = a => (Array.isArray(a) ? a : []).filter(x => x !== '' && x != null);
  // long text: blank line = new paragraph, "## " = heading, "- " = bullet, "> " = quote
  function prose(text) {
    return String(text || '').split(/\n\s*\n/).map(block => {
      const b = block.trim();
      if (!b) return '';
      if (b.startsWith('### ')) return `<h3>${rich(b.slice(4))}</h3>`;
      if (b.startsWith('## ')) return `<h2>${rich(b.slice(3))}</h2>`;
      if (b.startsWith('> ')) return `<blockquote>${rich(b.replace(/^>\s?/gm, ''))}</blockquote>`;
      if (/^- /.test(b)) return `<ul>${b.split('\n').map(l => `<li>${rich(l.replace(/^-\s*/, ''))}</li>`).join('')}</ul>`;
      return `<p>${rich(b)}</p>`;
    }).join('');
  }
  const icons = {
    mail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/></svg>',
    web: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>'
  };

  // o = the content object holding the texts (for per-text styles); k = which keys hold title / lead / eyebrow
  function pageHero({ image, eyebrow, title, lead, crumbs = [], tag = '', meta = [], o = null, k = {} }) {
    const home = (window.__RS && window.__RS.site && window.__RS.site.brandName) || 'خانه';
    const trail = [{ label: home, url: 'index.html' }].concat(crumbs);
    return `
      <section class="page-hero${image ? '' : ' no-img'}" style="${bg(image)}">
        <div class="container">
          <nav class="crumbs" aria-label="مسیر">${trail.map((c, i) => (i ? '<span aria-hidden="true">/</span>' : '') +
            (c.url ? `<a href="${url(c.url)}">${esc(c.label)}</a>` : `<span>${esc(c.label)}</span>`)).join('')}</nav>
          ${eyebrow ? `<span class="eyebrow"${sa(o, k.eyebrow || 'eyebrow')}>${esc(eyebrow)}</span>` : ''}
          <h1${sa(o, k.title || 'title')}>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}${heading(title)}</h1>
          ${lead ? `<p class="lead"${sa(o, k.lead || 'lead')}>${rich(lead)}</p>` : ''}
          ${meta.length ? `<div class="meta">${meta.filter(Boolean).map(m => `<span>${esc(m)}</span>`).join('<span aria-hidden="true">•</span>')}</div>` : ''}
        </div>
      </section>`;
  }

  function ctaBand(c) {
    const k = c.cta || {};
    if (!k.title) return '';
    return `
      <section class="cta-band">
        <div class="container">
          <div>
            ${k.eyebrow ? `<span class="eyebrow"${sa(k, 'eyebrow')}>${esc(k.eyebrow)}</span>` : ''}
            <h2${sa(k, 'title')}>${heading(k.title)}</h2>
            ${k.text ? `<p${sa(k, 'text')}>${rich(k.text)}</p>` : ''}
          </div>
          ${k.buttonLabel ? `<a class="btn btn-light" href="${url(k.buttonUrl)}"${target(k.buttonUrl)}${sa(k, 'buttonLabel')}>${esc(k.buttonLabel)} ${arrow}</a>` : ''}
        </div>
      </section>`;
  }

  function notFound(title, backUrl, backLabel) {
    return pageHero({ title }) + `
      <section class="section"><div class="container empty-state">
        <h2>این صفحه پیدا نشد</h2>
        <p>ممکن است آدرس اشتباه باشد یا این محتوا حذف شده باشد.</p>
        <a class="btn btn-primary" href="${url(backUrl)}">${esc(backLabel)} ${arrow}</a>
      </div></section>`;
  }

  const solutionUrl = id => `solution.html?id=${encodeURIComponent(id)}`;
  const capabilityUrl = id => `capability.html?id=${encodeURIComponent(id)}`;
  const articleUrl = id => `article.html?id=${encodeURIComponent(id)}`;
  const findBy = (arr, id) => (arr || []).find(x => x.id === id);

  function solutionCard(s, more) {
    return `<a class="info-card" href="${solutionUrl(s.id)}">
      ${s.tag ? `<span class="tag">${esc(s.tag)}</span>` : ''}
      <h3${sa(s, 'title')}>${heading(s.title)}</h3>
      ${s.summary ? `<p${sa(s, 'summary')}>${rich(s.summary)}</p>` : ''}
      <span class="more">${esc(more || 'بیشتر بخوانید')} ${arrow}</span>
    </a>`;
  }
  function capabilityCard(k, i, more) {
    return `<a class="info-card" href="${capabilityUrl(k.id)}">
      <span class="num">${pad2(i + 1)}</span>
      <h3${sa(k, 'title')}>${heading(k.title)}</h3>
      ${k.summary ? `<p${sa(k, 'summary')}>${rich(k.summary)}</p>` : ''}
      <span class="more">${esc(more || 'بیشتر بخوانید')} ${arrow}</span>
    </a>`;
  }
  function postCard(a, c, featured) {
    const p = (c.pages && c.pages.insights) || {};
    return `<a class="post-card${featured ? ' featured' : ''}" href="${articleUrl(a.id)}">
      <div class="thumb-wrap"><div class="thumb" style="${bg(a.image)}"></div></div>
      <div class="body">
        <div class="post-meta">${a.type ? `<span class="type"${sa(a, 'type')}>${esc(a.type)}</span>` : ''}${a.date ? `<span>${esc(a.date)}</span>` : ''}${a.readTime ? `<span>${esc(a.readTime)}</span>` : ''}</div>
        <h3${sa(a, 'title')}>${heading(a.title)}</h3>
        ${a.excerpt ? `<p${sa(a, 'excerpt')}>${rich(a.excerpt)}</p>` : ''}
        <span class="more"${sa(p, 'readMoreLabel')}>${esc(p.readMoreLabel || 'ادامه‌ی مطلب')} ${arrow}</span>
      </div>
    </a>`;
  }

  /* products slideshow on the services page — built from «راهکارهای ویژه» (and optionally «تخصص‌ها») */
  function productSlider(c) {
    const cfg = c.pages.solutions.products || {};
    const L = c.solutionPages.detailLabels || {};
    const items = (c.solutionPages.items || []).map(s => ({
      o: s, textKey: 'summary', tag: s.tag, title: s.title, text: s.summary, image: s.image, url: solutionUrl(s.id),
      points: list(s.outputs).slice(0, 4), pointsLabel: L.outputs || 'خروجی‌ها'
    }));
    if (cfg.source === 'both') (c.capabilityPages.items || []).forEach(k => items.push({
      o: k, textKey: 'summary', tag: '', title: k.title, text: k.summary, image: k.image, url: capabilityUrl(k.id), points: [], pointsLabel: ''
    }));
    if (!items.length) return '';
    const total = pad2(items.length);
    return `
      <div class="hero hero--split product-slider" data-autoplay="${cfg.autoplay !== false}" data-interval="${Number(cfg.interval) || 8}">
        <div class="ps-tabs" role="tablist">${items.map((it, i) => `
          <button class="hero-dot${i === 0 ? ' is-active' : ''}" role="tab" aria-label="${esc(it.title)}">
            <b>${esc(it.tag || pad2(i + 1))}</b><em>${esc(it.title)}</em><span></span>
          </button>`).join('')}</div>
        <div class="ps-stage">
          ${items.map((it, i) => `
          <div class="hero-slide${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}" role="tabpanel">
            <div class="hero-panel">
              <div class="hero-content">
                <div class="hero-count"><b>${pad2(i + 1)}</b><span>/ ${total}</span></div>
                ${it.tag ? `<span class="ps-tag">${esc(it.tag)}</span>` : ''}
                <h3 class="ps-title"${sa(it.o, 'title')}>${heading(it.title)}</h3>
                ${it.text ? `<div class="hero-text"><p${sa(it.o, it.textKey)}>${rich(it.text)}</p></div>` : ''}
                ${it.points.length ? `<div class="ps-points"><b${sa(L, 'outputs')}>${esc(it.pointsLabel)}</b><ul class="checks">${it.points.map(t => `<li${sa(it.o, 'outputs')}>${rich(t)}</li>`).join('')}</ul></div>` : ''}
                <div class="btn-group">
                  <a class="btn btn-primary" href="${it.url}"${sa(cfg, 'detailLabel')}>${esc(cfg.detailLabel || 'جزئیات راهکار')} ${arrow}</a>
                  ${cfg.ctaLabel ? `<a class="btn btn-outline" href="${url(cfg.ctaUrl || 'contact.html')}"${sa(cfg, 'ctaLabel')}>${esc(cfg.ctaLabel)}</a>` : ''}
                </div>
              </div>
            </div>
            <div class="hero-media"><div class="hero-bg" style="${bg(it.image)}"></div></div>
          </div>`).join('')}
          <div class="hero-controls"><div class="hero-arrows">
            <button class="hero-arrow hero-prev" aria-label="محصول قبلی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5l7 7-7 7"/></svg></button>
            <button class="hero-arrow hero-next" aria-label="محصول بعدی"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 5l-7 7 7 7"/></svg></button>
          </div></div>
        </div>
      </div>`;
  }

  const PAGES = {
    about(c) {
      const p = c.pages.about;
      const blocks = list(p.blocks);
      return pageHero({ image: p.image, eyebrow: p.eyebrow, title: p.title, lead: p.lead, crumbs: [{ label: p.title }], o: p }) + `
        ${blocks.length ? `<section class="section about-blocks"><div class="container">
          ${blocks.map((b, i) => `
            <div class="split about-block-item" style="${i > 0 ? 'margin-top:var(--s-8);padding-top:var(--s-8);border-top:1px solid var(--line);' : ''}">
              <div>
                <span class="num" style="display:block;margin-bottom:var(--s-1);color:var(--brand);font-weight:800;font-size:22px">${pad2(i + 1)}</span>
                <h2${sa(b, 'title')}>${heading(b.title)}</h2>
              </div>
              <div>
                ${String(b.text || '').split(/\n\s*\n/).map(t => `<p class="lead"${sa(b, 'text')}>${rich(t)}</p>`).join('')}
              </div>
            </div>`).join('')}
        </div></section>` : (list(p.paragraphs).length ? `<section class="section">
          <div class="container split">
            <div><h2${sa(p, 'introTitle')}>${heading(p.introTitle)}</h2></div>
            <div>${list(p.paragraphs).map(t => `<p class="lead"${sa(p, 'paragraphs')}>${rich(t)}</p>`).join('')}</div>
          </div>
        </section>` : '')}
        ${list(p.values).length ? `<section class="section surface"><div class="container">
          <div class="sec-head"><h2${sa(p, 'valuesTitle')}>${heading(p.valuesTitle)}</h2></div>
          <div class="cards">${p.values.map((v, i) => `<div class="info-card"><span class="num">${pad2(i + 1)}</span><h3${sa(v, 'title')}>${heading(v.title)}</h3><p${sa(v, 'text')}>${rich(v.text)}</p></div>`).join('')}</div>
        </div></section>` : ''}
        ${ctaBand(c)}`;
    },

    solutions(c) {
      const p = c.pages.solutions, sols = c.solutionPages.items || [], caps = c.capabilityPages.items || [];
      const pr = p.products || {};
      return pageHero({ image: p.image, eyebrow: p.eyebrow, title: p.title, lead: p.lead, crumbs: [{ label: 'خدمات' }], o: p }) + `
        ${sols.length ? `<section class="section"><div class="container">
          <div class="sec-head"><h2${sa(p, 'signatureTitle')}>${heading(p.signatureTitle)}</h2>
            ${pr.text ? `<p class="lead"${sa(pr, 'text')}>${rich(pr.text)}</p>` : ''}</div>
          ${pr.enabled === false ? `<div class="cards">${sols.map(s => solutionCard(s)).join('')}</div>` : productSlider(c)}
        </div></section>` : ''}
        ${list(p.areas).length ? `<section class="section surface"><div class="container">
          <div class="sec-head"><h2${sa(p, 'areasTitle')}>${heading(p.areasTitle)}</h2></div>
          <div class="cards">${p.areas.map((a, i) => `<div class="info-card"><span class="num">${pad2(i + 1)}</span><h3${sa(a, 'title')}>${heading(a.title)}</h3><p${sa(a, 'text')}>${rich(a.text)}</p>
            ${list(a.items).length ? `<div class="chips">${a.items.filter(Boolean).map(t => `<span${sa(a, 'items')}>${esc(t)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>
        </div></section>` : ''}
        ${list(p.pains).length ? `<section class="section pains"><div class="container" style="display:block">
          <div class="sec-head"><h2${sa(p, 'painsTitle')}>${heading(p.painsTitle)}</h2>${p.painsText ? `<p class="lead"${sa(p, 'painsText')}>${rich(p.painsText)}</p>` : ''}</div>
          <div class="pain-cards">${p.pains.map(x => `<div class="pain-card"><h3${sa(x, 'title')}>${heading(x.title)}</h3><p${sa(x, 'problem')}>${rich(x.problem)}</p>
            ${x.help ? `<div class="help"><b${sa(p, 'helpLabel')}>${esc(p.helpLabel || 'چطور کمک می‌کنیم')}</b><p${sa(x, 'help')}>${rich(x.help)}</p></div>` : ''}</div>`).join('')}</div>
        </div></section>` : ''}
        ${list(p.compareItems).length ? `<section class="section"><div class="container split">
          <div><h2${sa(p, 'compareTitle')}>${heading(p.compareTitle)}</h2>${p.compareText ? `<p class="lead"${sa(p, 'compareText', 'margin-top:16px;')}>${rich(p.compareText)}</p>` : ''}</div>
          <ul class="checks cross">${p.compareItems.filter(Boolean).map(t => `<li${sa(p, 'compareItems')}>${rich(t)}</li>`).join('')}</ul>
        </div></section>` : ''}
        ${caps.length ? `<section class="section surface"><div class="container">
          <div class="sec-head"><h2${sa(p, 'capabilitiesTitle')}>${heading(p.capabilitiesTitle)}</h2></div>
          <div class="cards">${caps.map((k, i) => capabilityCard(k, i)).join('')}</div>
        </div></section>` : ''}
        ${ctaBand(c)}`;
    },

    solution(c) {
      const sp = c.solutionPages, s = findBy(sp.items, qsId()), L = sp.detailLabels || {};
      if (!s) return notFound('راهکار پیدا نشد', 'solutions.html', 'همه‌ی خدمات');
      document.title = `${s.tag ? s.tag + ' — ' : ''}${s.title} | ${c.site.brandName || ''}`;
      const caps = list(s.capabilities).map(id => findBy(c.capabilityPages.items, id)).filter(Boolean);
      const posts = list(s.articles).map(id => findBy(c.articles.items, id)).filter(Boolean);
      return pageHero({ image: s.image, eyebrow: '', title: s.title, tag: s.tag, lead: s.summary,
        crumbs: [{ label: 'خدمات', url: 'solutions.html' }, { label: s.title }], o: s, k: { lead: 'summary' } }) + `
        <section class="section"><div class="container">
          ${s.intro ? `<div class="sec-head"><p class="lead"${sa(s, 'intro', 'color:var(--navy);font-weight:400;')}>${rich(s.intro)}</p></div>` : ''}
          <div class="detail-grid">
            ${s.challenge ? `<div class="detail-box"><h3${sa(L, 'challenge')}>${heading(L.challenge)}</h3><p${sa(s, 'challenge')}>${rich(s.challenge)}</p></div>` : ''}
            ${s.audience ? `<div class="detail-box"><h3${sa(L, 'audience')}>${heading(L.audience)}</h3><p${sa(s, 'audience')}>${rich(s.audience)}</p></div>` : ''}
          </div>
        </div></section>
        ${list(s.questions).length ? `<section class="section surface"><div class="container split">
          <div><h2${sa(L, 'questions')}>${heading(L.questions)}</h2></div>
          <ul class="checks">${s.questions.filter(Boolean).map(q => `<li${sa(s, 'questions')}>${rich(q)}</li>`).join('')}</ul>
        </div></section>` : ''}
        ${list(s.approach).length || list(s.outputs).length ? `<section class="section"><div class="container detail-grid">
          ${list(s.approach).length ? `<div><div class="sec-head" style="margin-bottom:24px"><h2${sa(L, 'approach')}>${heading(L.approach)}</h2></div><ol class="steps">${s.approach.filter(Boolean).map(t => `<li${sa(s, 'approach')}>${rich(t)}</li>`).join('')}</ol></div>` : ''}
          ${list(s.outputs).length ? `<div><div class="sec-head" style="margin-bottom:24px"><h2${sa(L, 'outputs')}>${heading(L.outputs)}</h2></div><div class="detail-box"><ul class="checks">${s.outputs.filter(Boolean).map(t => `<li${sa(s, 'outputs')}>${rich(t)}</li>`).join('')}</ul></div></div>` : ''}
        </div></section>` : ''}
        ${list(s.impacts).length ? `<section class="section pains"><div class="container" style="display:block">
          <div class="sec-head"><h2${sa(L, 'impacts')}>${heading(L.impacts)}</h2></div>
          <div class="impact-row">${s.impacts.filter(Boolean).map(t => `<div class="impact"${sa(s, 'impacts')}>${rich(t)}</div>`).join('')}</div>
          ${s.disclaimer ? `<p class="note"${sa(s, 'disclaimer', 'color:rgba(255,255,255,.6);')}>${rich(s.disclaimer)}</p>` : ''}
        </div></section>` : ''}
        ${list(s.faqs).length ? `<section class="section"><div class="container">
          <div class="sec-head"><h2${sa(L, 'faq')}>${heading(L.faq)}</h2></div>
          <div class="faq">${s.faqs.filter(f => f.q).map((f, i) => `<details${i === 0 ? ' open' : ''}><summary${sa(f, 'q')}>${esc(f.q)}</summary><p${sa(f, 'a')}>${rich(f.a)}</p></details>`).join('')}</div>
        </div></section>` : ''}
        ${caps.length || list(s.industries).length ? `<section class="section surface"><div class="container detail-grid">
          ${caps.length ? `<div class="detail-box"><h3${sa(L, 'capabilities')}>${heading(L.capabilities)}</h3><div class="chips">${caps.map(k => `<a href="${capabilityUrl(k.id)}">${esc(k.title)}</a>`).join('')}</div></div>` : ''}
          ${list(s.industries).length ? `<div class="detail-box"><h3${sa(L, 'industries')}>${heading(L.industries)}</h3><div class="chips">${s.industries.filter(Boolean).map(t => `<span${sa(s, 'industries')}>${esc(t)}</span>`).join('')}</div></div>` : ''}
        </div></section>` : ''}
        ${posts.length ? `<section class="section"><div class="container">
          <div class="sec-head"><h2${sa(c.pages.insights, 'relatedTitle')}>${heading((c.pages.insights || {}).relatedTitle || 'بینش‌های مرتبط')}</h2></div>
          <div class="post-grid">${posts.map(a => postCard(a, c)).join('')}</div>
        </div></section>` : ''}
        ${ctaBand(c)}`;
    },

    capability(c) {
      const cp = c.capabilityPages, k = findBy(cp.items, qsId());
      if (!k) return notFound('تخصص پیدا نشد', 'solutions.html', 'همه‌ی خدمات');
      document.title = `${k.title} | ${c.site.brandName || ''}`;
      const sols = list(k.solutions).map(id => findBy(c.solutionPages.items, id)).filter(Boolean);
      const others = (cp.items || []).filter(x => x.id !== k.id);
      return pageHero({ image: k.image, eyebrow: '', title: k.title, lead: k.summary,
        crumbs: [{ label: 'خدمات', url: 'solutions.html' }, { label: k.title }], o: k, k: { lead: 'summary' } }) + `
        ${k.body ? `<section class="section"><div class="container"><div class="prose"${sa(k, 'body')}>${prose(k.body)}</div></div></section>` : ''}
        ${sols.length ? `<section class="section surface"><div class="container">
          <div class="sec-head"><h2${sa(cp, 'relatedTitle')}>${heading(cp.relatedTitle || 'راهکارهای مرتبط')}</h2></div>
          <div class="cards">${sols.map(s => solutionCard(s)).join('')}</div>
        </div></section>` : ''}
        ${others.length ? `<section class="section"><div class="container">
          <div class="sec-head"><h2${sa(c.pages.solutions, 'capabilitiesTitle')}>${heading((c.pages.solutions || {}).capabilitiesTitle || 'سایر تخصص‌ها')}</h2></div>
          <div class="cards">${others.map(x => capabilityCard(x, (cp.items || []).indexOf(x))).join('')}</div>
        </div></section>` : ''}
        ${ctaBand(c)}`;
    },

    insights(c) {
      const p = c.pages.insights, posts = c.articles.items || [];
      return pageHero({ image: p.image, eyebrow: p.eyebrow, title: p.title, lead: p.lead, crumbs: [{ label: 'دیدگاه‌ها' }], o: p }) + `
        <section class="section"><div class="container">
          ${posts.length ? `<div class="post-grid">${posts.map((a, i) => postCard(a, c, i === 0)).join('')}</div>`
            : '<div class="empty-state"><h2>هنوز مطلبی منتشر نشده است.</h2></div>'}
        </div></section>
        ${ctaBand(c)}`;
    },

    article(c) {
      const posts = c.articles.items || [], a = findBy(posts, qsId()), p = c.pages.insights || {};
      if (!a) return notFound('مطلب پیدا نشد', 'insights.html', 'همه‌ی مطالب');
      document.title = `${a.title} | ${c.site.brandName || ''}`;
      const related = posts.filter(x => x.id !== a.id).slice(0, 3);
      return pageHero({ eyebrow: a.type, title: a.title, lead: a.excerpt, meta: [a.date, a.readTime],
        crumbs: [{ label: 'دیدگاه‌ها', url: 'insights.html' }, { label: a.title }], o: a, k: { eyebrow: 'type', lead: 'excerpt' } }) + `
        <section class="section"><div class="container">
          ${a.image ? `<div class="article-cover" style="${bg(a.image)}"></div>` : ''}
          <article class="prose"${sa(a, 'body')}>${prose(a.body)}</article>
        </div></section>
        ${related.length ? `<section class="section surface"><div class="container">
          <div class="sec-head"><h2${sa(p, 'relatedTitle')}>${heading(p.relatedTitle || 'بینش‌های مرتبط')}</h2></div>
          <div class="post-grid">${related.map(x => postCard(x, c)).join('')}</div>
        </div></section>` : ''}
        ${ctaBand(c)}`;
    },

    contact(c) {
      const p = c.pages.contact;
      const opt = arr => list(arr).map(o => `<option>${esc(o)}</option>`).join('');
      const fld = (label, control, required, cls = '') =>
        `<label class="f-field ${cls}"><span class="lbl">${esc(label)}${required ? ' <i class="req">*</i>' : ''}</span>${control}</label>`;
      const channels = [
        p.email && `<a class="channel" href="mailto:${esc(p.email)}"><span class="ico">${icons.mail}</span><span class="latin">${esc(p.email)}</span></a>`,
        p.phone && `<a class="channel" href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}"><span class="ico">${icons.phone}</span><span class="latin">${esc(p.phone)}</span></a>`,
        p.website && `<a class="channel" href="${url(/^https?:/.test(p.website) ? p.website : 'https://' + p.website)}" target="_blank" rel="noopener"><span class="ico">${icons.web}</span><span class="latin">${esc(p.website)}</span></a>`,
        p.linkedin && `<a class="channel" href="${url(p.linkedin)}" target="_blank" rel="noopener"><span class="ico">${icons.linkedin}</span><span>لینکدین</span></a>`
      ].filter(Boolean).join('');
      return pageHero({ image: p.image, eyebrow: p.eyebrow, title: p.title, lead: p.lead, crumbs: [{ label: 'تماس با ما' }], o: p }) + `
        <section class="section"><div class="container contact-grid">
          <aside class="contact-card">
            <h2${sa(p, 'channelsTitle')}>${heading(p.channelsTitle)}</h2>
            ${channels}
            ${!p.phone && p.phoneNote ? `<p class="muted"${sa(p, 'phoneNote')}>${rich(p.phoneNote)}</p>` : ''}
          </aside>
          <form class="form-card" id="contact-form" novalidate>
            <h2${sa(p, 'formTitle')}>${heading(p.formTitle)}</h2>
            ${p.formIntro ? `<p${sa(p, 'formIntro')}>${rich(p.formIntro)}</p>` : ''}
            <div class="form-grid">
              <label class="hp" aria-hidden="true">Website <input name="website_hp" tabindex="-1" autocomplete="off"></label>
              ${fld('نام و نام خانوادگی', '<input name="fullName" required maxlength="120" placeholder=" ">', true)}
              ${fld('نام برند', '<input name="company" required maxlength="120" placeholder=" ">', true)}
              ${fld('شماره تماس', '<input name="mobile" required inputmode="tel" maxlength="30" placeholder=" " pattern="[0-9۰-۹+\\-\\s()]{7,}">', true)}
              ${fld('ایمیل', '<input name="email" type="email" maxlength="160" placeholder=" ">')}
              ${fld('سمت', '<input name="jobTitle" maxlength="120">')}
              ${fld('صنعت', `<select name="industry"><option value="">انتخاب کنید</option>${opt(p.industryOptions)}</select>`)}
              ${fld('تعداد شعب', '<input name="branches" maxlength="20" inputmode="numeric">')}
              ${fld('شهر', '<input name="city" maxlength="80">')}
              ${fld('روش تماس ترجیحی', `<select name="preferredContactMethod"><option value="">انتخاب کنید</option>${opt(p.contactMethods)}</select>`)}
              ${fld('زمان مناسب تماس', '<input name="preferredContactTime" maxlength="80">')}
              ${fld('مسئله‌ای که کسب‌وکارتان با آن مواجه است', '<textarea name="primaryChallenge" maxlength="3000"></textarea>', false, 'full')}
              <label class="f-check full"><input type="checkbox" name="consent" required> <span${sa(p, 'consentText')}>${rich(p.consentText)}</span></label>
            </div>
            <button class="btn btn-primary" type="submit"${sa(p, 'submitLabel')}>${esc(p.submitLabel || 'ارسال')} ${arrow}</button>
            <div class="form-status" id="form-status" hidden></div>
          </form>
        </div></section>`;
    },

    page(c) {
      const pg = findBy((c.legalPages || {}).items, qsId());
      if (!pg) return notFound('صفحه پیدا نشد', 'index.html', 'بازگشت به صفحه‌ی اصلی');
      document.title = `${pg.title} | ${c.site.brandName || ''}`;
      return pageHero({ title: pg.title, crumbs: [{ label: pg.title }], o: pg }) + `
        <section class="section"><div class="container"><div class="prose"${sa(pg, 'body')}>${prose(pg.body)}</div></div></section>`;
    }
  };

  function initContactForm(c) {
    const form = $('#contact-form');
    if (!form) return;
    const status = $('#form-status');
    const show = (msg, ok) => { status.hidden = false; status.className = 'form-status ' + (ok ? 'ok' : 'err'); status.textContent = msg; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) {
        const bad = form.querySelector(':invalid');
        show(bad && bad.name === 'consent' ? 'لطفاً موافقت با ذخیره‌ی اطلاعات را تأیید کنید.' : 'لطفاً فیلدهای الزامی (نام، برند، شماره تماس) را درست کامل کنید.', false);
        if (bad) bad.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      data.consent = form.consent.checked;
      data.page = location.pathname;
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        const r = await fetch('api/index.php?action=contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.ok === false) throw new Error(j.error || 'ارسال ناموفق بود.');
        form.reset();
        show((c.pages.contact || {}).successMessage || 'درخواست شما ثبت شد.', true);
      } catch (err) {
        show(err.message + ' می‌توانید از طریق ایمیل هم با ما در تماس باشید.', false);
      }
      btn.disabled = false;
    });
  }

  /* ---------- section order & visibility (admin → «ترتیب بخش‌ها») ---------- */
  const BLOCKS = ['about', 'services', 'pains', 'difference', 'solutions', 'industries'];
  function applyLayout(c) {
    const saved = ((c.layout || {}).sections || []).filter(s => BLOCKS.includes(s.key));
    // blocks missing from the saved order are appended (visible) so new sections never disappear
    const order = saved.concat(BLOCKS.filter(k => !saved.some(s => s.key === k)).map(key => ({ key, visible: true })));
    const main = $('main');
    order.forEach(({ key, visible }) => {
      document.querySelectorAll(`[data-block="${key}"]`).forEach(el => visible === false ? el.remove() : main.append(el));
    });
  }

  /* ---------- boot ---------- */
  // fill in missing blocks so older content files keep working
  function normalize(c) {
    c.site = c.site || {}; c.pages = c.pages || {};
    ['about', 'solutions', 'insights', 'contact'].forEach(k => { c.pages[k] = c.pages[k] || {}; });
    ['solutionPages', 'capabilityPages', 'articles', 'legalPages'].forEach(k => { c[k] = c[k] || { items: [] }; c[k].items = c[k].items || []; });
    return c;
  }

  // highlight the menu item of the current page
  function markCurrent(page) {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const parent = { solution: 'solutions.html', capability: 'solutions.html', article: 'insights.html' }[page];
    document.querySelectorAll('#main-nav > ul > li > a').forEach(a => {
      const href = (a.getAttribute('href') || '').split(/[?#]/)[0].toLowerCase();
      if (href && href !== 'index.html' && (href === file || href === parent)) a.classList.add('is-current');
    });
  }

  function render(c) {
    normalize(c);
    window.__RS = c;
    applyTypography(c);
    const page = document.body.dataset.page || 'home';
    const md = document.querySelector('meta[name="description"]');
    if (md && c.site.description) md.setAttribute('content', c.site.description);
    renderHeader(c);

    if (page === 'home') {
      applyLayout(c);
      if (c.site.title) document.title = c.site.title;
      renderHero(c);
      // hidden sections were removed from the page by applyLayout — skip them
      [['#about', renderAbout], ['#services', renderServices], ['#pains', renderPains], ['#difference', renderDifference],
       ['#solutions', renderSolutions], ['#industries', renderIndustries]].forEach(([sel, fn]) => { if ($(sel)) fn(c); });
    } else if (PAGES[page]) {
      const titles = { about: c.pages.about.title, solutions: 'خدمات', insights: c.pages.insights.title, contact: c.pages.contact.title };
      if (titles[page]) document.title = `${titles[page]} | ${c.site.brandName || ''}`;
      $('main').innerHTML = PAGES[page](c);
      initContactForm(c);
      document.querySelectorAll('.product-slider').forEach(el =>
        initHeroSlider(el, { autoplay: el.dataset.autoplay !== 'false', interval: el.dataset.interval }));
    }

    renderFooter(c);
    markCurrent(page);
    initHeader();
    document.body.classList.remove('is-loading');
    applySizes();
    // fonts arriving later change nothing in size, but re-run once they are in to be safe
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(applySizes);
  }

  // the admin panel's "پیش‌نمایش" button opens index.html?preview=1 with unsaved content in localStorage
  if (new URLSearchParams(location.search).has('preview')) {
    try {
      const draft = JSON.parse(localStorage.getItem('rs_preview_content') || 'null');
      if (draft) { render(draft); document.title = '[پیش‌نمایش] ' + document.title; return; }
    } catch (e) { /* fall through to the published content */ }
  }

  fetch(CONTENT_URL + '?v=' + Date.now(), { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(err => {
      console.error('Content load failed', err);
      document.body.classList.remove('is-loading');
      document.querySelector('main').innerHTML = '<div class="load-error">محتوای سایت بارگذاری نشد. سایت باید از طریق یک وب‌سرور باز شود (نه مستقیم از فایل).</div>';
    });
})();
