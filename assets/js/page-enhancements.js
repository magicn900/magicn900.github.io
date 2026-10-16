/** Optional services must never delay the document or a page change. */
(function () {
  'use strict';
  const resources = new Map();
  let dispose = function () {};
  let gallery;
  let translationReady;

  function resource(url, style) {
    if (resources.has(url)) return resources.get(url);
    const promise = new Promise(function (resolve, reject) {
      const node = document.createElement(style ? 'link' : 'script');
      if (style) { node.rel = 'stylesheet'; node.href = url; }
      else { node.src = url; node.async = true; }
      const timer = setTimeout(fail, 8000);
      function fail() {
        clearTimeout(timer);
        node.remove();
        resources.delete(url);
        reject(new Error('Optional resource unavailable'));
      }
      node.onload = function () { clearTimeout(timer); resolve(); };
      node.onerror = fail;
      document.head.appendChild(node);
    });
    resources.set(url, promise);
    return promise;
  }

  async function photoLibrary() {
    await Promise.all([
      resource('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe.min.js'),
      resource('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe.css', true),
      resource('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/default-skin/default-skin.css', true)
    ]);
    await resource('https://cdnjs.cloudflare.com/ajax/libs/photoswipe/4.1.3/photoswipe-ui-default.min.js');
  }

  function translationLibrary() {
    if (window.google?.translate?.TranslateElement) return Promise.resolve();
    if (translationReady) return translationReady;
    const url = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    translationReady = new Promise(function (resolve, reject) {
      const timer = setTimeout(fail, 8000);
      function fail() {
        clearTimeout(timer);
        translationReady = null;
        resources.delete(url);
        reject(new Error('Translation unavailable'));
      }
      window.googleTranslateElementInit = function () {
        clearTimeout(timer);
        if (window.google?.translate?.TranslateElement) resolve();
        else fail();
      };
      // The bootstrap's load event precedes Google's actual ready callback.
      resource(url).catch(fail);
    });
    return translationReady;
  }

  function init() {
    dispose();
    const controller = new AbortController();
    const signal = controller.signal;
    dispose = function () {
      controller.abort();
      if (gallery) { gallery.close(); gallery = null; }
    };

    const article = document.querySelector('.post-content');
    if (article) {
      article.querySelectorAll('img:not(.emoji)').forEach(function (image) {
        if (image.closest('a')) return;
        const link = document.createElement('a');
        link.href = image.src;
        link.className = 'photo-swipe';
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', image.alt ? '查看图片：' + image.alt : '查看大图');
        image.before(link); link.appendChild(image);
      });
      let opening = false;
      article.addEventListener('click', async function (event) {
        const link = event.target.closest('a.photo-swipe');
        if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (opening) return;
        opening = true;
        try {
          await photoLibrary();
          if (signal.aborted) return;
          const links = Array.from(article.querySelectorAll('a.photo-swipe'));
          const items = links.map(function (item) {
            const image = item.querySelector('img');
            const caption = document.createElement('span');
            caption.textContent = image.getAttribute('caption') || image.alt;
            return { src: item.href, w: image.naturalWidth || image.width || 1200, h: image.naturalHeight || image.height || 800, title: caption.innerHTML };
          });
          gallery = new window.PhotoSwipe(document.querySelector('.pswp'), window.PhotoSwipeUI_Default, items, {
            index: links.indexOf(link), bgOpacity: .9, history: false, showAnimationDuration: 0, hideAnimationDuration: 0
          });
          gallery.init();
        } catch (_) {
          if (!signal.aborted) location.assign(link.href);
        } finally { opening = false; }
      }, { signal });
    }

    // Rouge's build-time highlighting remains usable even when the enhancement fails.
    const codeBlocks = Array.from(document.querySelectorAll('pre code')).filter(block => !block.querySelector('span') && !block.classList.contains('hljs'));
    if (codeBlocks.length) {
      resource('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/highlight.min.js').then(function () {
        if (signal.aborted) return;
        codeBlocks.forEach(function (block) {
          window.hljs.highlightBlock(block);
        });
      }).catch(function () { /* Plain code is already readable. */ });
    }

    const language = document.getElementById('site-language');
    if (language) language.addEventListener('change', async function () {
      if (!language.value) return;
      const control = language.closest('.translation-control');
      const status = control.querySelector('.translation-status');
      const requestedLanguage = language.value;
      status.classList.add('visually-hidden');
      if (requestedLanguage.toLowerCase() === control.dataset.pageLanguage.toLowerCase()) {
        try { sessionStorage.removeItem('site-translation'); } catch (_) { /* Optional persistence. */ }
        document.cookie = 'googtrans=; Max-Age=0; path=/';
        const domains = location.hostname.split('.');
        while (domains.length > 1) {
          document.cookie = 'googtrans=; Max-Age=0; path=/; domain=.' + domains.join('.');
          domains.shift();
        }
        if (window.siteTranslationActive) location.reload();
        else language.value = '';
        return;
      }
      language.disabled = true;
      status.textContent = '正在准备翻译';
      // Google's widget owns translated DOM. Subsequent navigation uses its normal lifecycle.
      window.siteTranslationActive = true;
      try {
        await translationLibrary();
        if (signal.aborted) return;
        if (!control.querySelector('.goog-te-combo')) {
          new window.google.translate.TranslateElement({ pageLanguage: control.dataset.pageLanguage, autoDisplay: false }, 'google_translate_element');
        }
        const combo = await new Promise(function (resolve, reject) {
          const started = Date.now();
          const check = function () {
            const select = control.querySelector('.goog-te-combo');
            if (signal.aborted || Date.now() - started > 6000) reject(new Error('Translation unavailable'));
            else if (select && select.options.length > 1) resolve(select);
            else setTimeout(check, 100);
          };
          check();
        });
        combo.value = requestedLanguage;
        combo.dispatchEvent(new Event('change', { bubbles: true }));
        try { sessionStorage.setItem('site-translation', requestedLanguage); } catch (_) { /* Optional persistence. */ }
        status.textContent = '已切换翻译语言';
      } catch (_) {
        window.siteTranslationActive = false;
        status.textContent = '翻译暂时不可用，稍后可以再试';
        status.classList.remove('visually-hidden');
        language.value = '';
      } finally { language.disabled = false; }
    }, { signal });
    if (language) {
      try {
        const saved = sessionStorage.getItem('site-translation');
        if (saved && Array.from(language.options).some(option => option.value === saved)) {
          language.value = saved;
          language.dispatchEvent(new Event('change'));
        }
      } catch (_) { /* Translation remains available without storage. */ }
    }
  }
  document.addEventListener('site:page-ready', init);
  document.addEventListener('site:before-swap', function () { dispose(); });
  init();
})();
