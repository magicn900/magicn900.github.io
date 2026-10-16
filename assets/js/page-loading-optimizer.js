/** Feedback belongs to navigation, never to optional images or window.load. */
(function () {
  'use strict';
  let indicator;
  let timers = [];
  function finish() {
    timers.forEach(clearTimeout);
    timers = [];
    if (indicator) indicator.remove();
    indicator = null;
    document.querySelector('.navigation-error')?.remove();
    document.querySelector('#page-content')?.removeAttribute('aria-busy');
  }
  function start() {
    finish();
    document.querySelector('#page-content')?.setAttribute('aria-busy', 'true');
    timers.push(setTimeout(function () {
      indicator = document.createElement('div');
      indicator.id = 'page-loading';
      indicator.className = 'page-loading';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      indicator.innerHTML = '<div class="loading-capsules" aria-hidden="true">' +
        '<span class="loading-capsule"></span>'.repeat(3) + '</div>' +
        '<span class="loading-text" hidden>努力搬运中</span>';
      document.body.appendChild(indicator);
    }, 300));
    timers.push(setTimeout(function () {
      if (indicator) indicator.querySelector('.loading-text').hidden = false;
    }, 1000));
  }
  function error(retry) {
    finish();
    const notice = document.createElement('div');
    notice.className = 'navigation-error';
    notice.innerHTML = '<span role="status">这页暂时没搬过来</span>' +
      '<button type="button" class="navigation-retry">重试</button>' +
      '<button type="button" class="navigation-dismiss" aria-label="关闭提示">×</button>';
    notice.querySelector('.navigation-retry').addEventListener('click', retry);
    notice.querySelector('.navigation-dismiss').addEventListener('click', function () {
      finish();
      document.querySelector('#page-content')?.focus({ preventScroll: true });
    });
    document.body.appendChild(notice);
  }
  window.SiteLoading = { start, finish, error };
  window.addEventListener('pagehide', finish);
})();
