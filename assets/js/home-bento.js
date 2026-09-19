// ============================================================
// home-bento.js — 新版主页（精选 + 全部文章）
// ------------------------------------------------------------
// 职责：
//   1) 全部文章：打开时显示 N 行，每次点「加载更多」再显示 M 行，
//      没有更多时隐藏按钮（行数在 config 的 [home.bento] 里配）
//   2) 最新 / 热门 切换：最新 = 服务端渲染的日期倒序；热门 = 按统计分数倒序
//   3) 统计：按评论系统自动选择数据源（Waline：浏览量+评论数；Twikoo：评论数）
//   4) 精选·自动：拿到统计后，把精选槽位按热度重排内容（无 JS 时是「最新」）
// 所有请求都在页面加载完之后才发，不阻塞首屏。
// ============================================================
(function () {
  'use strict';

  var cfg = window.hbConfig || {};
  var root = document.getElementById('home-bento');
  if (!root) return;

  var grid = document.getElementById('hbArticles');
  var moreBtn = root.querySelector('[data-hb-more]');
  var subEl = root.querySelector('[data-hb-sub]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-hb-sort]'));
  if (!grid) return;

  var initialRows = cfg.initialRows || 3;
  var loadRows = cfg.loadRows || 5;
  var extraRows = 0;
  var currentSort = 'latest';

  function cards() { return Array.prototype.slice.call(grid.querySelectorAll('[data-hb-card]')); }

  // 当前列数（跟着 CSS 断点走，1 / 2 / 3）
  function columns() {
    var tpl = getComputedStyle(grid).gridTemplateColumns;
    var n = tpl.split(' ').filter(Boolean).length;
    return n > 0 ? n : 1;
  }

  function visibleCount() {
    return Math.max(1, (initialRows + extraRows) * columns());
  }

  // ==================== 加载更多 ====================
  function applyVisibility() {
    var list = cards();
    var limit = visibleCount();
    list.forEach(function (el, i) { el.hidden = i >= limit; });
    if (moreBtn) {
      var done = limit >= list.length;
      moreBtn.hidden = done;
      if (!done) moreBtn.textContent = cfg.labelMore || '加载更多';
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      extraRows += loadRows;
      applyVisibility();
    });
  }

  // 窗口尺寸变化 → 列数变了，重新按行数计算显示数量
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyVisibility, 150);
  });

  // ==================== 最新 / 热门 ====================
  var latestOrder = cards();      // 服务端就是日期倒序
  var stats = null;               // { views: Map, comments: Map }

  function scoreOf(card) {
    if (!stats) return 0;
    var path = pathOf(card);
    var v = (stats.views && stats.views.get(path)) || 0;
    var c = (stats.comments && stats.comments.get(path)) || 0;
    return v * (cfg.viewsWeight || 1) + c * (cfg.commentsWeight || 10);
  }

  function pathOf(card) {
    try { return new URL(card.getAttribute('href'), location.origin).pathname; }
    catch (e) { return card.getAttribute('href') || ''; }
  }

  function setSort(kind) {
    currentSort = kind;
    var list = cards();
    var ordered = kind === 'hot'
      ? list.slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); })
      : latestOrder.slice();
    ordered.forEach(function (el) { grid.appendChild(el); });

    tabs.forEach(function (btn) {
      var active = btn.getAttribute('data-hb-sort') === kind;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (subEl) {
      var total = list.length;
      var tpl = kind === 'hot' ? (cfg.labelSubHot || '共 %d 篇 · 按热度排序') : (cfg.labelSubLatest || '共 %d 篇 · 按时间排序');
      subEl.textContent = tpl.replace('%d', total);
    }
    applyVisibility();
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-hb-sort');
      if (kind === 'hot' && !stats) return;   // 统计不可用时不做反应
      setSort(kind);
    });
  });

  // ==================== 统计（浏览量 / 评论数） ====================
  function getJSON(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function loadStats() {
    var provider = cfg.provider;
    if (!provider || provider === 'none' || !cfg.serverUrl) return Promise.resolve(null);
    var paths = cards().map(pathOf);

    if (provider === 'waline') {
      // 浏览量：一次请求批量取回（顺序与传入的 path 一致）
      return getJSON(cfg.serverUrl + '/article?path=' + encodeURIComponent(paths.join(',')))
        .then(function (arr) {
          var views = new Map();
          paths.forEach(function (p, i) { views.set(p, Array.isArray(arr) ? (arr[i] || 0) : (arr || 0)); });
          // 评论数：只探测浏览量最高的前若干篇，避免几十个请求
          var probe = paths.slice().sort(function (a, b) { return (views.get(b) || 0) - (views.get(a) || 0); })
            .slice(0, cfg.commentProbe || 12);
          var comments = new Map();
          return Promise.all(probe.map(function (p) {
            return getJSON(cfg.serverUrl + '/comment?path=' + encodeURIComponent(p) + '&type=count')
              .then(function (n) { comments.set(p, typeof n === 'number' ? n : 0); })
              .catch(function () { /* 单条失败忽略 */ });
          })).then(function () { return { views: views, comments: comments }; });
        });
    }

    if (provider === 'twikoo') {
      // Twikoo 没有浏览量，只用评论数
      return fetch(cfg.serverUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'GET_COMMENTS_COUNT', urls: paths })
      }).then(function (r) { return r.json(); }).then(function (arr) {
        var comments = new Map();
        paths.forEach(function (p, i) { comments.set(p, Array.isArray(arr) ? (arr[i] || 0) : 0); });
        return { views: new Map(), comments: comments };
      });
    }

    return Promise.resolve(null);
  }

  // 卡片上显示浏览量（配置开启时）
  function paintViews() {
    if (!cfg.showViews || !stats || !stats.views) return;
    cards().forEach(function (card) {
      var el = card.querySelector('[data-hb-views]');
      if (!el) return;
      var n = stats.views.get(pathOf(card)) || 0;
      el.textContent = (cfg.labelViews || '%d 次浏览').replace('%d', n);
      el.hidden = false;
    });
  }

  // 精选·自动：按热度重排精选槽位的内容
  function refillFeatured() {
    if (cfg.featuredMode !== 'auto' || !stats) return;
    var slots = Array.prototype.slice.call(root.querySelectorAll('#hbFeatured [data-hb-slot]'));
    if (!slots.length) return;
    var ranked = cards().slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); });
    slots.forEach(function (slot, i) {
      var src = ranked[i];
      if (!src) return;
      var title = text(src, '[data-hb-title]');
      var desc = text(src, '[data-hb-desc]');
      var date = text(src, '[data-hb-date]');
      var tag = text(src, '[data-hb-tag]');
      var img = src.querySelector('img');
      var href = src.getAttribute('href');
      if (href) slot.setAttribute('href', href);
      if (title) set(slot, '[data-hb-title]', title);
      if (desc) set(slot, '[data-hb-desc]', desc);
      if (date) set(slot, '[data-hb-date]', date);
      if (tag) { set(slot, '[data-hb-tag]', tag); set(slot, '[data-hb-pill]', tag); }
      var slotImg = slot.querySelector('img');
      if (slotImg && img) {
        slotImg.setAttribute('src', img.getAttribute('src'));
        slotImg.setAttribute('alt', title || '');
        slotImg.removeAttribute('fetchpriority');
        slotImg.setAttribute('loading', 'lazy');
      }
    });
  }

  function text(el, sel) {
    var n = el.querySelector(sel);
    return n ? n.textContent.trim() : '';
  }

  function set(el, sel, value) {
    var n = el.querySelector(sel);
    if (n) n.textContent = value;
  }

  // ==================== 启动 ====================
  applyVisibility();

  // 统计在页面加载完成后的空闲时段再请求，避免和首屏抢带宽
  function start() {
    loadStats().then(function (s) {
      if (!s) {
        // 拿不到统计：隐藏「热门」，保留「最新」
        root.setAttribute('data-hb-stats', 'none');
        tabs.forEach(function (btn) {
          if (btn.getAttribute('data-hb-sort') === 'hot') btn.hidden = true;
        });
        return;
      }
      stats = s;
      root.setAttribute('data-hb-stats', 'ready');
      paintViews();
      refillFeatured();
      if (currentSort === 'hot') setSort('hot');
    }).catch(function () {
      root.setAttribute('data-hb-stats', 'error');
      tabs.forEach(function (btn) {
        if (btn.getAttribute('data-hb-sort') === 'hot') btn.hidden = true;
      });
    });
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.addEventListener('load', function () { setTimeout(start, 200); });
  }
})();
