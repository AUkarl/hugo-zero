// ============================================================
// home-bento.js — 新版主页（精选 + 全部文章）
// ------------------------------------------------------------
// 职责：
//   1) 全部文章：打开时显示 N 行，每次点「加载更多」再显示 M 行，
//      没有更多时隐藏按钮（行数在 config 的 [home.bento] 里配）
//   2) 最新 / 热门 切换：最新 = 服务端渲染的日期倒序；热门 = 按统计分数倒序
//   3) 统计：按评论系统自动选择数据源（Waline：浏览量+评论数；Twikoo：评论数）
//   4) 精选·自动：拿到统计后按热度重排精选槽位
//
// 加载体验（避免"先显示最新、再跳成最热"的闪烁）：
//   · 统计结果缓存在 localStorage（默认 6 小时）：再次打开时立刻按热度渲染，零等待
//   · 页面上先渲染骨架态（卡片底色，尺寸不变），取数完成一次性显示
//   · 页面一解析完就并行发起统计请求（不占用首屏关键资源）
// ============================================================
(function () {
  'use strict';

  var cfg = window.hbConfig || {};
  var root = document.getElementById('home-bento');
  if (!root) return;

  var grid = document.getElementById('hbArticles');
  var featured = document.getElementById('hbFeatured');
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
    var n = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    return n > 0 ? n : 1;
  }

  function visibleCount() { return Math.max(1, (initialRows + extraRows) * columns()); }

  // ==================== 加载更多 ====================
  function applyVisibility() {
    var list = cards();
    var limit = visibleCount();
    list.forEach(function (el, i) { el.hidden = i >= limit; });
    if (moreBtn) moreBtn.hidden = limit >= list.length;
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      extraRows += loadRows;
      applyVisibility();
    });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyVisibility, 150);
  });

  // ==================== 最新 / 热门 ====================
  var latestOrder = cards();      // 服务端就是日期倒序
  var stats = null;               // { views: Map, comments: Map }

  function pathOf(card) {
    try { return new URL(card.getAttribute('href'), location.origin).pathname; }
    catch (e) { return card.getAttribute('href') || ''; }
  }

  function scoreOf(card) {
    if (!stats) return 0;
    var p = pathOf(card);
    var v = (stats.views && stats.views.get(p)) || 0;
    var c = (stats.comments && stats.comments.get(p)) || 0;
    return v * (cfg.viewsWeight || 1) + c * (cfg.commentsWeight || 10);
  }

  function setSort(kind) {
    currentSort = kind;
    var list = cards();

    var apply = function () {
      var ordered = kind === 'hot'
        ? list.slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); })
        : latestOrder.slice();
      ordered.forEach(function (el) { grid.appendChild(el); });
      // 重新排序 + 显隐一起做完，再让 FLIP 按最终位置做补间动画
      applyVisibility();
    };

    if (window.Motion) window.Motion.flip(grid, apply, { selector: '[data-hb-card]' });
    else apply();

    tabs.forEach(function (btn) {
      var active = btn.getAttribute('data-hb-sort') === kind;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (subEl) {
      var tpl = kind === 'hot' ? (cfg.labelSubHot || '共 %d 篇 · 按热度排序') : (cfg.labelSubLatest || '共 %d 篇 · 按时间排序');
      subEl.textContent = tpl.replace('%d', list.length);
    }
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-hb-sort');
      if (kind === 'hot' && !stats) return;   // 统计不可用时不做反应
      setSort(kind);
    });
  });

  // ==================== 骨架态显隐 ====================
  // 精选卡片的入场动画只播一次：骨架态（服务端渲染的最新几篇）先不参与，
  // 等统计到位、内容换成最热的之后再一起错开淡入，避免先跳一次再动一次
  var featuredAnimated = false;

  function revealFeatured() {
    if (featuredAnimated || !featured || !window.Motion) return;
    featuredAnimated = true;
    var slots = featured.querySelectorAll('[data-hb-slot]');
    Array.prototype.forEach.call(slots, function (el) { el.setAttribute('data-reveal', ''); });
    window.Motion.reveal(featured);
  }

  function reveal() {
    if (!featured) return;
    featured.classList.remove('hb-pending');
    featured.classList.add('hb-revealed');
    revealFeatured();
    painted = true;
  }

  // 精选区是否已经显示过（显示过之后的重排才需要补位动画）
  var painted = false;

  // ==================== 统计缓存 ====================
  var CACHE_KEY = 'hbStats:v1:' + location.pathname;
  function cacheMinutes() { return typeof cfg.cacheMinutes === 'number' ? cfg.cacheMinutes : 360; }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !obj.t) return null;
      if (Date.now() - obj.t > cacheMinutes() * 60000) return null;
      return { views: new Map(obj.v || []), comments: new Map(obj.c || []) };
    } catch (e) { return null; }
  }

  function writeCache(s) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        t: Date.now(),
        v: Array.from(s.views || []),
        c: Array.from(s.comments || [])
      }));
    } catch (e) { /* 隐私模式等写不了，忽略 */ }
  }

  // ==================== 统计请求 ====================
  function getJSON(url) {
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function loadViews() {
    var provider = cfg.provider, paths = cards().map(pathOf);
    if (!provider || provider === 'none' || !cfg.serverUrl || !paths.length) return Promise.resolve(null);

    if (provider === 'waline') {
      // 浏览量：一次请求批量取回（顺序与传入的 path 一致）—— 最快的那一步，先拿它显示
      return getJSON(cfg.serverUrl + '/article?path=' + encodeURIComponent(paths.join(',')))
        .then(function (arr) {
          var views = new Map();
          paths.forEach(function (p, i) { views.set(p, Array.isArray(arr) ? (arr[i] || 0) : (arr || 0)); });
          return { views: views };
        });
    }

    if (provider === 'twikoo') {
      // Twikoo 没有浏览量，直接进入评论数阶段
      return Promise.resolve({ views: new Map() });
    }

    return Promise.resolve(null);
  }

  function loadComments(views) {
    var provider = cfg.provider, paths = cards().map(pathOf);
    var weight = cfg.commentsWeight || 0;
    var probe = weight > 0 ? Math.max(0, cfg.commentProbe || 6) : 0;
    if (!provider || !cfg.serverUrl || !paths.length || !probe) return Promise.resolve(null);

    if (provider === 'waline') {
      // 评论数只探测浏览量前几名，控制请求数；失败不影响主流程
      var top = paths.slice().sort(function (a, b) { return (views.get(b) || 0) - (views.get(a) || 0); }).slice(0, probe);
      var comments = new Map();
      return Promise.all(top.map(function (p) {
        return getJSON(cfg.serverUrl + '/comment?path=' + encodeURIComponent(p) + '&type=count')
          .then(function (n) { comments.set(p, typeof n === 'number' ? n : 0); })
          .catch(function () { /* 单条失败忽略 */ });
      })).then(function () { return comments; });
    }

    if (provider === 'twikoo') {
      return fetch(cfg.serverUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'GET_COMMENTS_COUNT', urls: paths })
      }).then(function (r) { return r.json(); }).then(function (arr) {
        var comments = new Map();
        paths.forEach(function (p, i) { comments.set(p, Array.isArray(arr) ? (arr[i] || 0) : 0); });
        return comments;
      });
    }

    return Promise.resolve(null);
  }

  // ==================== 应用统计结果 ====================
  function paintViews() {
    if (!cfg.showViews || !stats || !stats.views) return;
    cards().forEach(function (card) {
      var el = card.querySelector('[data-hb-views]');
      if (!el) return;
      el.textContent = (cfg.labelViews || '%d 次浏览').replace('%d', stats.views.get(pathOf(card)) || 0);
      el.hidden = false;
    });
  }

  function refillFeatured() {
    if (cfg.featuredMode !== 'auto' || !stats || !featured) return;
    var slots = Array.prototype.slice.call(featured.querySelectorAll('[data-hb-slot]'));
    if (!slots.length) return;
    var ranked = cards().slice().sort(function (a, b) { return scoreOf(b) - scoreOf(a); });

    // 已经显示过之后（比如评论数回来导致顺序变化）才做「内容滑到新位置」的补位动画
    var useMotion = painted && !!window.Motion;
    var before = null;
    if (useMotion) {
      before = {};
      slots.forEach(function (slot) {
        var h = slot.getAttribute('href');
        if (!h) return;
        var r = slot.getBoundingClientRect();
        before[h] = { x: r.left, y: r.top };
      });
    }

    slots.forEach(function (slot, i) {
      var src = ranked[i];
      if (!src) return;
      var title = text(src, '[data-hb-title]');
      var desc = text(src, '[data-hb-desc]');
      var date = text(src, '[data-hb-date]');
      var tag = text(src, '[data-hb-tag]');
      var href = src.getAttribute('href');
      if (href) slot.setAttribute('href', href);
      if (title) set(slot, '[data-hb-title]', title);
      if (desc) set(slot, '[data-hb-desc]', desc);
      if (date) set(slot, '[data-hb-date]', date);
      if (tag) { set(slot, '[data-hb-tag]', tag); set(slot, '[data-hb-pill]', tag); }

      // 封面：LQIP 换成新文章的（直接读源卡片容器的背景图），高清图重新挂上延迟加载并淡入
      var srcWrap = src.querySelector('.hb-a-img');
      var slotWrap = slot.querySelector('.hb-a-img, .hb-wide-img, .hb-top-img') || slot;
      if (srcWrap && slotWrap) {
        var lqipBg = window.getComputedStyle(srcWrap).backgroundImage;
        if (lqipBg && lqipBg !== 'none') slotWrap.style.backgroundImage = lqipBg;
      }
      var srcImg = src.querySelector('img');
      var slotImg = slot.querySelector('img');
      if (srcImg && slotImg) {
        var next = srcImg.getAttribute('data-src') || srcImg.getAttribute('src') || '';
        var nextSet = srcImg.getAttribute('data-srcset') || '';
        slotImg.removeAttribute('src');
        slotImg.removeAttribute('srcset');
        slotImg.classList.remove('is-loaded');
        if (next) slotImg.setAttribute('data-src', next);
        if (nextSet) slotImg.setAttribute('data-srcset', nextSet);
        // 不覆盖 sizes：槽位自己的 sizes 才对得上它的宽度（首屏大图尤其重要）
        slotImg.setAttribute('alt', title || '');
        if (window.Motion) window.Motion.lazyImages(slot);
      }
    });

    if (useMotion) {
      window.Motion.flipByKey(before, function (el) { return el.getAttribute('href'); }, slots, { duration: 440 });
    }
  }

  function text(el, sel) { var n = el.querySelector(sel); return n ? n.textContent.trim() : ''; }
  function set(el, sel, value) { var n = el.querySelector(sel); if (n) n.textContent = value; }

  function applyStats() {
    paintViews();
    refillFeatured();
    if (currentSort === 'hot') setSort('hot');
  }

  function hideHotTab() {
    tabs.forEach(function (btn) {
      if (btn.getAttribute('data-hb-sort') === 'hot') btn.hidden = true;
    });
  }

  // ==================== 图片兜底 ====================
  // 封面加载失败（图源在部分网络不可达等）时：
  //   1) 若配置了 default_image，自动换成兜底图重试一次
  //   2) 否则给 img 加 hb-img-failed（由 CSS 隐藏，露出莫兰迪渐变底）
  root.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var fallback = cfg.fallbackImage;
    if (fallback && img.getAttribute('src') !== fallback && img.getAttribute('data-hb-retried') !== '1') {
      img.setAttribute('data-hb-retried', '1');
      img.classList.remove('hb-img-failed');
      img.setAttribute('src', fallback);
      return;
    }
    img.classList.add('hb-img-failed');
  }, true);

  // ==================== 启动 ====================
  applyVisibility();

  // 动效：文章卡片进入视口时错开上移淡入；封面先显示 LQIP，高清图提前 200px 加载
  if (window.Motion) {
    window.Motion.reveal(root);
    window.Motion.lazyImages(root);
  }

  // 1) 先用缓存立刻按热度渲染（再次打开本页时零等待、无闪烁）
  var cached = readCache();
  if (cached) {
    stats = cached;
    root.setAttribute('data-hb-stats', 'cache');
    applyStats();
    reveal();
  }

  // 2) 并行取最新统计（解析完就发，不等 idle）
  //    先拿浏览量 → 立刻显示正确顺序；评论数回来后再按新分数平滑重排一次
  //    （精选卡此时已经显示，重排走 FLIP 补位动画，不会瞬移）
  function refresh() {
    loadViews().then(function (v) {
      if (!v) {
        if (!cached) { root.setAttribute('data-hb-stats', 'none'); hideHotTab(); }
        reveal();
        return;
      }
      stats = { views: v.views, comments: new Map() };
      root.setAttribute('data-hb-stats', 'views');
      applyStats();
      reveal();

      loadComments(v.views).then(function (comments) {
        if (!comments || !comments.size) return;
        stats = { views: v.views, comments: comments };
        root.setAttribute('data-hb-stats', 'ready');
        writeCache(stats);
        applyStats();
      }).catch(function () { /* 评论数拿不到就算了，浏览量排序仍然有效 */ });
    }).catch(function () {
      if (!cached) { root.setAttribute('data-hb-stats', 'error'); hideHotTab(); }
      reveal();
    });
  }

  refresh();
})();
