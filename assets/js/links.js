/* ============================================================
   links.js — 友链页交互
     1) 选项卡切换（点击 / 左右方向键 / URL hash 记忆）
     2) 朋友动态分页：每页条数读 params.toml 的 [links] per_page（模板写进 data-per-page）
     3) 我的信息 / 提交示例 的复制按钮
     4) 朋友动态左侧封面：加载完成后淡入
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1) 选项卡 ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.links-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.links-panel'));

  function activate(name, focusTab) {
    if (!name || !tabs.some(function (t) { return t.dataset.tab === name; })) return;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    panels.forEach(function (p) {
      var on = p.id === 'panel-' + name;
      p.classList.toggle('is-active', on);
      p.hidden = !on;
    });
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* 忽略 */ }
  }

  if (tabs.length) {
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t.dataset.tab); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        activate(next.dataset.tab, true);
      });
    });
    var fromHash = (location.hash || '').replace('#', '');
    activate(fromHash || (tabs[0] && tabs[0].dataset.tab));
    window.addEventListener('hashchange', function () {
      activate((location.hash || '').replace('#', ''));
    });
  }

  /* ---------- 2) 朋友动态分页（每页条数由 [links] per_page 决定） ---------- */
  var grid = document.getElementById('feedGrid');
  var pager = document.getElementById('feedPager');
  // 模板把配置值写到 data-per-page；取不到就退回 10（= 两列五行）
  var PER_PAGE = parseInt((grid && grid.getAttribute('data-per-page')) || '10', 10) || 10;

  if (grid && pager) {
    var items = Array.prototype.slice.call(grid.querySelectorAll('[data-feed-item]'));
    var totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    var page = 1;

    function render() {
      var start = (page - 1) * PER_PAGE;
      items.forEach(function (el, i) {
        el.hidden = i < start || i >= start + PER_PAGE;
      });
      pager.innerHTML = '';
      if (totalPages <= 1) { pager.hidden = true; return; }
      pager.hidden = false;

      var prev = document.createElement('button');
      prev.type = 'button';
      prev.textContent = '← 上一页';
      prev.disabled = page === 1;
      prev.addEventListener('click', function () { page = Math.max(1, page - 1); render(); scrollTop(); });

      var label = document.createElement('span');
      label.textContent = page + ' / ' + totalPages + '（共 ' + items.length + ' 条）';

      var next = document.createElement('button');
      next.type = 'button';
      next.textContent = '下一页 →';
      next.disabled = page === totalPages;
      next.addEventListener('click', function () { page = Math.min(totalPages, page + 1); render(); scrollTop(); });

      pager.appendChild(prev);
      pager.appendChild(label);
      pager.appendChild(next);
    }

    function scrollTop() {
      var top = pager.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    render();
  }

  /* ---------- 3) 我的信息 / 提交示例 的复制按钮 ---------- */
  Array.prototype.slice.call(document.querySelectorAll('.apply-copy')).forEach(function (btn) {
    var id = btn.getAttribute('data-copy-target');
    var box = id ? document.getElementById(id) : null;
    if (!box) return;
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var text = (box.innerText || box.textContent || '').trim();
      var done = function () {
        btn.textContent = '已复制';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = original; btn.classList.remove('is-done'); }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallback(text, done); });
      } else {
        fallback(text, done);
      }
    });
  });

  // 剪贴板 API 不可用（http 环境、旧浏览器）时的兜底
  function fallback(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) { /* 复制不了就算了 */ }
  }

  /* ---------- 4) 朋友动态左侧封面：加载完成后淡入 ----------
     只给「还没加载完」的图加 is-loading，加载好就摘掉（失败也一样，交给首字母占位），
     所以 JS 没执行时图片照常直接显示，不会白图。 */
  Array.prototype.slice.call(document.querySelectorAll('.feed-cover img')).forEach(function (img) {
    var done = function () { img.classList.remove('is-loading'); };
    if (img.complete && img.naturalWidth) return;                 // 已经在缓存里：直接显示
    img.classList.add('is-loading');
    img.addEventListener('load', done);
    img.addEventListener('error', done);
  });
})();
