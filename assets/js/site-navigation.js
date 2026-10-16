/** Progressive navigation for our static layouts. Native links still work without JS. */
(function () {
  'use strict';
  if (!window.fetch || !window.AbortController || !history.pushState ||
      !document.body.hasAttribute('data-site-navigation')) return;

  const feedback = window.SiteLoading;
  const pageHead = 'title, meta[name="description"], meta[property], meta[name^="twitter:"], ' +
    'link[rel="canonical"], link[rel="alternate"], script[type="application/ld+json"]';
  const snapshots = new Map();
  const maxSnapshots = 20;
  let pending;
  let rollingBack = false;
  let currentURL = location.href;
  let entry = history.state?.siteNavigation || { key: makeKey(), index: 0, x: scrollX, y: scrollY };
  let scrollFrame;
  let transition;

  function makeKey() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail })); }
  function state(value) { return Object.assign({}, history.state, { siteNavigation: value }); }
  function writePosition() {
    entry.x = scrollX; entry.y = scrollY;
    if (history.state?.siteNavigation?.key === entry.key) history.replaceState(state(entry), '', currentURL);
  }
  history.replaceState(state(entry), '', currentURL);
  history.scrollRestoration = 'manual';

  function remember() {
    writePosition();
    const body = document.body.cloneNode(true);
    body.querySelectorAll('.page-loading, .navigation-error').forEach(function (node) { node.remove(); });
    body.querySelector('#page-content')?.removeAttribute('aria-busy');
    snapshots.delete(entry.key);
    snapshots.set(entry.key, {
      body,
      head: Array.from(document.head.querySelectorAll(pageHead), node => node.cloneNode(true)),
      lang: document.documentElement.lang,
      dir: document.documentElement.getAttribute('dir'),
      entry: Object.assign({}, entry)
    });
    if (snapshots.size > maxSnapshots) snapshots.delete(snapshots.keys().next().value);
  }

  function stop() {
    if (pending) {
      pending.controller.abort();
      clearTimeout(pending.timeout);
      pending.styles.forEach(node => node.remove());
      pending = null;
    }
    feedback?.finish();
  }

  function focusAndScroll(url, position, restore) {
    let anchor;
    try { anchor = document.getElementById(decodeURIComponent(new URL(url).hash.slice(1))); } catch (_) { /* Invalid hash. */ }
    const target = anchor || document.getElementById('page-content');
    if (!restore && target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
    }
    if (position) window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' });
    else if (anchor) anchor.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.dataset.scrollStatus = scrollY <= 1 ? 'top' : 'scrolled';
  }

  function show(snapshot, url, targetEntry, restore) {
    emit('site:before-swap');
    remember();
    feedback?.finish();
    document.head.querySelectorAll(pageHead).forEach(node => node.remove());
    snapshot.head.forEach(node => document.head.appendChild(node.cloneNode(true)));
    document.documentElement.lang = snapshot.lang || 'zh-CN';
    if (snapshot.dir) document.documentElement.setAttribute('dir', snapshot.dir);
    else document.documentElement.removeAttribute('dir');
    if (restore) {
      entry = Object.assign({}, targetEntry);
      history.replaceState(state(entry), '', url);
    } else {
      entry = { key: makeKey(), index: (history.state?.siteNavigation?.index ?? entry.index) + 1, x: 0, y: 0 };
      history.pushState(state(entry), '', url);
    }
    currentURL = url;
    document.body.replaceWith(snapshot.body.cloneNode(true));
    emit('site:page-ready', { navigation: true, restore });
    focusAndScroll(url, restore ? snapshot.entry || entry : null, restore);
    writePosition();
    // Never fade out to an empty frame. The next readable page starts almost opaque.
    transition?.cancel();
    if (!restore && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition = document.getElementById('page-content')?.animate?.(
        [{ opacity: .86 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
    }
  }

  async function prepareStyles(doc, url, job) {
    const existing = new Set(Array.from(document.querySelectorAll('link[rel="stylesheet"]'), node => node.href));
    const links = Array.from(doc.querySelectorAll('head link[rel="stylesheet"]:not([data-site-optional])'));
    await Promise.all(links.map(function (link) {
      const href = new URL(link.getAttribute('href'), url).href;
      if (existing.has(href)) return;
      return new Promise(function (resolve, reject) {
        const added = link.cloneNode(true);
        added.href = href;
        added.media = 'not all';
        added.dataset.navigationMedia = link.media || 'all';
        added.removeAttribute('onload');
        added.onload = resolve;
        added.onerror = () => reject(new Error('Stylesheet unavailable'));
        job.controller.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
        job.styles.push(added);
        document.head.appendChild(added);
      });
    }));
  }

  function compatible(doc, url) {
    if (!doc.body.matches('[data-site-navigation="1"]') || !doc.querySelector('#page-content') || doc.querySelector('base')) return false;
    // Unknown page scripts need the browser's full document lifecycle (e.g. future comment widgets).
    if (doc.body.querySelector('script:not([type="application/ld+json"]):not([type="application/json"])')) return false;
    const runtime = root => Array.from(root.querySelectorAll('script[data-site-runtime]'), node => new URL(node.getAttribute('src'), url).href).join('|');
    return runtime(doc) === runtime(document);
  }

  async function navigate(url, targetEntry) {
    stop();
    const restore = !!targetEntry;
    const job = { controller: new AbortController(), styles: [], url, targetEntry };
    pending = job;
    feedback?.start();
    job.timeout = setTimeout(() => job.controller.abort(), 12000);
    try {
      const cached = restore && snapshots.get(targetEntry.key);
      if (cached) {
        clearTimeout(job.timeout);
        pending = null;
        show(cached, url, targetEntry, true);
        return;
      }
      const response = await fetch(url, {
        signal: job.controller.signal,
        credentials: 'same-origin',
        headers: { Accept: 'text/html' }
      });
      if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') || '')) throw new Error('Page unavailable');
      const html = await response.text();
      if (job !== pending) return;
      const finalURL = new URL(response.url);
      if (!finalURL.hash) finalURL.hash = new URL(url).hash;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      if (finalURL.origin !== location.origin || !compatible(doc, finalURL.href) || window.siteTranslationActive) {
        stop();
        location.assign(finalURL.href);
        return;
      }
      await prepareStyles(doc, finalURL.href, job);
      if (job !== pending || job.controller.signal.aborted) return;
      clearTimeout(job.timeout);
      job.styles.forEach(function (link) { link.media = link.dataset.navigationMedia; });
      job.styles = [];
      pending = null;
      show({ body: doc.body, head: Array.from(doc.head.querySelectorAll(pageHead)), lang: doc.documentElement.lang, dir: doc.documentElement.getAttribute('dir') }, finalURL.href, targetEntry, restore);
    } catch (_) {
      if (job !== pending) return;
      stop();
      if (restore) {
        const delta = entry.index - targetEntry.index;
        if (delta) {
          rollingBack = true;
          history.go(delta);
        }
      }
      feedback?.error(function () {
        if (rollingBack) return;
        if (restore) history.go(targetEntry.index - entry.index);
        else navigate(url);
      });
    }
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || rollingBack) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self') ||
        link.closest('[data-native-navigation]') || link.rel.split(/\s+/).includes('external') || window.siteTranslationActive) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || /\.[^/]+$/.test(url.pathname) && !/\.html?$/.test(url.pathname)) return;
    event.preventDefault();
    const current = new URL(currentURL);
    if (url.pathname === current.pathname && url.search === current.search && (url.hash || link.getAttribute('href') === '#')) {
      stop();
      remember();
      entry = { key: makeKey(), index: entry.index + 1, x: 0, y: 0 };
      history.pushState(state(entry), '', url);
      currentURL = url.href;
      focusAndScroll(currentURL);
      writePosition();
    } else navigate(url.href);
  });

  window.addEventListener('popstate', function (event) {
    if (rollingBack) { rollingBack = false; return; }
    const target = event.state?.siteNavigation;
    if (!target) { location.reload(); return; }
    navigate(location.href, target);
  });
  document.addEventListener('site:url-change', function () { currentURL = location.href; });
  window.addEventListener('scroll', function () {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(function () { scrollFrame = null; writePosition(); });
  }, { passive: true });
  window.addEventListener('pagehide', function () { writePosition(); stop(); });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { currentURL = location.href; entry = history.state?.siteNavigation || entry; }
  });
})();
