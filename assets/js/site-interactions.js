/** Shared navigation, reading controls, and restrained entrance motion. */
(function () {
  'use strict';
  let dispose = function () {};
  function init(event) {
    dispose();
    const controller = new AbortController();
    const on = function (target, name, handler, options) {
      target.addEventListener(name, handler, Object.assign({}, options, { signal: controller.signal }));
    };
    let themeTimer;
    const root = document.documentElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const header = document.querySelector('.site-header');
    const themeButton = document.querySelector('.header-theme-toggle');
    const menuButton = document.querySelector('.nav-menu-button');
    const navigation = document.getElementById('site-navigation');
    const entrances = new Set();

    function enter(elements) {
      if (reducedMotion.matches || !Element.prototype.animate) return;
      elements.slice(0, 3).forEach(function (element, index) {
        const animation = element.animate([
          { opacity: .45, transform: 'translateY(4px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 240, delay: index * 35, easing: 'cubic-bezier(.2,.7,.2,1)' });
        entrances.add(animation);
        animation.onfinish = function () { entrances.delete(animation); };
      });
    }

    function syncThemeButton() {
      const dark = root.dataset.theme === 'dark';
      themeButton.setAttribute('aria-label', dark ? '切换到亮色模式' : '切换到暗色模式');
      themeButton.querySelector('.theme-symbol').textContent = dark ? '☀︎' : '☾';
    }
    function nextThemeBoundary() {
      const now = new Date();
      const next = new Date(now);
      if (now.getHours() >= 19) next.setDate(next.getDate() + 1);
      next.setHours(now.getHours() >= 19 || now.getHours() < 7 ? 7 : 19, 0, 0, 0);
      return next;
    }
    function setTheme(dark) {
      root.dataset.theme = dark ? 'dark' : 'light';
      syncThemeButton();
      try {
        const storage = themeButton.dataset.nightMode === 'manual' ? localStorage : sessionStorage;
        storage.setItem('theme', JSON.stringify({ nightShift: dark, autoToggleAt: nextThemeBoundary().getTime() }));
      } catch (_) { /* Switching still works when storage is unavailable. */ }
    }
    if (themeButton) {
      themeButton.hidden = false;
      syncThemeButton();
      on(themeButton, 'click', function () { setTheme(root.dataset.theme !== 'dark'); });
      if (themeButton.dataset.nightMode === 'auto') {
        const schedule = function () {
          themeTimer = setTimeout(function () {
            const hours = new Date().getHours();
            setTheme(hours >= 19 || hours < 7);
            schedule();
          }, nextThemeBoundary().getTime() - Date.now() + 100);
        };
        schedule();
      }
    }

    function closeMenu() {
      header.classList.remove('nav-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', '打开导航菜单');
    }
    if (header && menuButton && navigation) {
      header.dataset.menuReady = 'true';
      menuButton.hidden = false;
      closeMenu();
      on(menuButton, 'click', function () {
        const open = header.classList.toggle('nav-open');
        menuButton.setAttribute('aria-expanded', String(open));
        menuButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
      });
      on(document, 'keydown', function (event) {
        if (event.key === 'Escape' && header.classList.contains('nav-open')) {
          closeMenu(); menuButton.focus();
        }
      });
      on(document, 'click', function (event) {
        if (!header.contains(event.target) || event.target.closest('#site-navigation a')) closeMenu();
      });
      on(matchMedia('(max-width: 800px)'), 'change', closeMenu);
    }

    function updateHeader() { root.dataset.scrollStatus = window.scrollY <= 1 ? 'top' : 'scrolled'; }
    updateHeader();
    on(window, 'scroll', updateHeader, { passive: true });

    document.querySelectorAll('.post-filters').forEach(function (filters) {
      const list = filters.closest('.reading-list');
      const posts = Array.from(list.querySelectorAll('.post-item'));
      const buttons = Array.from(filters.querySelectorAll('button[data-category]'));
      filters.hidden = false;
      function selectCategory(category, animate) {
        const button = buttons.find(item => item.dataset.category === category) || buttons[0];
        buttons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
        posts.forEach(function (post) {
          post.hidden = !!button.dataset.category && !JSON.parse(post.dataset.categories).includes(button.dataset.category);
        });
        const visible = posts.filter(function (post) { return !post.hidden; });
        list.querySelector('.post-count').textContent = visible.length + ' 篇记录';
        if (animate) enter(visible);
      }
      selectCategory(new URL(location.href).searchParams.get('category') || '', false);
      on(filters, 'click', function (event) {
        const button = event.target.closest('button[data-category]');
        if (!button) return;
        selectCategory(button.dataset.category, true);
        const url = new URL(location.href);
        if (button.dataset.category) url.searchParams.set('category', button.dataset.category);
        else url.searchParams.delete('category');
        // Replacing this entry keeps refresh/share consistent without adding a history entry per filter.
        history.replaceState(history.state, '', url);
        document.dispatchEvent(new CustomEvent('site:url-change'));
      });
    });

    const article = document.querySelector('.post-content');
    const toc = document.querySelector('.post-menu');
    if (article && toc) {
      const headings = Array.from(article.querySelectorAll('h2, h3, h4'));
      if (headings.length) {
        const links = document.createElement('ul');
        headings.forEach(function (heading, index) {
          if (!heading.id) heading.id = 'section-' + index;
          const item = document.createElement('li');
          item.className = 'h-' + heading.tagName.toLowerCase();
          const link = document.createElement('a');
          link.href = '#' + encodeURIComponent(heading.id);
          link.textContent = heading.textContent;
          item.appendChild(link); links.appendChild(item);
        });
        toc.querySelector('.post-menu-content').replaceChildren(links);
        toc.hidden = false;
        const mobile = document.createElement('details');
        mobile.className = 'mobile-toc';
        const previousMobile = document.querySelector('.mobile-toc');
        if (previousMobile) { mobile.open = previousMobile.open; previousMobile.remove(); }
        const summary = document.createElement('summary');
        summary.textContent = '文章目录';
        mobile.append(summary, links.cloneNode(true));
        article.before(mobile);
        const trackHeading = function () {
          const active = headings.filter(function (heading) { return heading.getBoundingClientRect().top <= 100; }).pop() || headings[0];
          toc.querySelectorAll('a').forEach(function (link) {
            const selected = decodeURIComponent(link.hash.slice(1)) === active.id;
            link.parentElement.classList.toggle('active', selected);
            if (selected) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        };
        trackHeading();
        let pending = false;
        on(window, 'scroll', function () {
          if (pending) return;
          pending = true;
          requestAnimationFrame(function () { if (!controller.signal.aborted) trackHeading(); pending = false; });
        }, { passive: true });
      }
    }

    const video = document.querySelector('.page-banner video');
    function syncMotion() {
      if (reducedMotion.matches) { entrances.forEach(function (animation) { animation.cancel(); }); entrances.clear(); }
      if (video) {
        if (reducedMotion.matches) video.pause();
        else video.play().catch(function () { /* The original poster remains visible. */ });
      }
    }
    on(reducedMotion, 'change', syncMotion);
    syncMotion();
    if (!event || !event.detail || !event.detail.navigation) {
      enter(Array.from(document.querySelectorAll('.post-item')).length ? Array.from(document.querySelectorAll('.post-item')) : Array.from(document.querySelectorAll('.main')));
    }

    document.querySelectorAll('.back-to-top').forEach(function (link) {
      on(link, 'click', function (event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      });
    });
    dispose = function () {
      controller.abort();
      clearTimeout(themeTimer);
      entrances.forEach(function (animation) { animation.cancel(); });
      entrances.clear();
      if (video) video.pause();
    };
  }
  document.addEventListener('site:page-ready', init);
  document.addEventListener('site:before-swap', function () { dispose(); });
  init();
})();
