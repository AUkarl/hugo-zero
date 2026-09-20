// ============================================================
// motion.js — 全站动效工具（很小，只做三件事）
// ------------------------------------------------------------
//   1) reveal()  进入视口时「轻微上移 + 淡入」，同一行的元素依次错开
//   2) flip()    元素重排时从旧位置平滑滑到新位置（FLIP）
//   3) lazyImages() 图片先显示 LQIP，进入视口前 200px 再加载高清
//
// 设计取舍（为了不拖慢页面）：
//   · 用 IntersectionObserver，不监听 scroll，不在滚动里做任何计算
//   · 只动 opacity / transform / filter，全部走合成层
//   · 每个元素只在真正进入视口时算一次行/列（拿 offsetTop 分组），之后不再计算
//   · 动画播完立刻把 data-reveal 摘掉，元素回到普通状态，不再有额外样式开销
//   · prefers-reduced-motion 时全部直接显示，不做任何动画
// ============================================================
(function () {
  'use strict';

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ============================================================
     1) 进入视口错开淡入
     ============================================================ */
  var revealObserver = null;
  var revealSeen = typeof WeakSet === 'function' ? new WeakSet() : null;

  function makeObserver() {
    if (revealObserver) return revealObserver;
    revealObserver = new IntersectionObserver(function (entries) {
      // 同一帧里进来的元素一起排队，保证「同行依次」的节奏
      var batch = [];
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        batch.push(entry.target);
      });
      if (batch.length) applyStagger(batch);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    return revealObserver;
  }

  // 按「行」分组：先用 offsetTop 找出每行的第一个元素，再按顺序给同一行的元素编号
  function applyStagger(els) {
    var rows = [];
    els.sort(function (a, b) { return a.offsetTop - b.offsetTop || a.offsetLeft - b.offsetLeft; });
    els.forEach(function (el) {
      var row = null;
      for (var i = 0; i < rows.length; i++) {
        if (Math.abs(rows[i].top - el.offsetTop) <= 4) { row = rows[i]; break; }
      }
      if (!row) { row = { top: el.offsetTop, n: 0 }; rows.push(row); }
      var delay = Math.min(row.n * 70, 420);   // 同行依次，最多等 0.42s
      row.n++;
      el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('is-in');
      el.addEventListener('animationend', function done(ev) {
        if (ev.animationName !== 'motion-reveal') return;
        el.removeEventListener('animationend', done);
        el.removeAttribute('data-reveal');     // 摘掉后不再有任何动效样式
        el.classList.remove('is-in');
        el.style.removeProperty('--reveal-delay');
      });
    });
  }

  /**
   * 让容器内带 [data-reveal] 的元素在进入视口时依次淡入
   * @param {Element|Document} root
   * @param {Object} [opts] { oncePerElement:true, immediate:false }
   */
  function reveal(root, opts) {
    opts = opts || {};
    var scope = root || document;
    var els = [].slice.call(scope.querySelectorAll('[data-reveal]:not(.is-in)'));
    if (!els.length) return;
    if (revealSeen) {
      els = els.filter(function (el) { return !revealSeen.has(el); });
      els.forEach(function (el) { revealSeen.add(el); });
      if (!els.length) return;
    }
    // 老浏览器没有 IntersectionObserver / 用户要求减少动效 → 直接显示，别把内容藏死
    if (reduceMotion() || opts.immediate || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.removeAttribute('data-reveal');
        el.classList.remove('is-in');
      });
      return;
    }
    var io = makeObserver();
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     2) FLIP：重排前后位置变化用动画补上
     ============================================================ */
  /**
   * @param {Element} container 子元素会被重排的容器
   * @param {Function} mutate 真正做重排的函数（同步改 DOM）
   * @param {Object} [opts] { duration, selector }
   */
  function flip(container, mutate, opts) {
    opts = opts || {};
    var sel = opts.selector || '*';
    var kids = [].slice.call(container.querySelectorAll(':scope > ' + sel));
    if (reduceMotion()) { mutate(); return; }

    var before = [];
    kids.forEach(function (el) {
      if (el.hidden || el.hasAttribute('data-reveal')) return;   // 正在入场动画的元素不参与
      var r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      before.push({ el: el, x: r.left, y: r.top });
    });

    mutate();

    var dur = opts.duration || 340;
    before.forEach(function (item) {
      var r = item.el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      var dx = Math.round(item.x - r.left);
      var dy = Math.round(item.y - r.top);
      if (!dx && !dy) return;
      item.el.animate(
        [{ transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' }, { transform: 'none' }],
        { duration: dur, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      );
    });
  }

  /**
   * 内容被换掉时让「同一份内容」从旧位置滑到新位置
   * @param {Object} before  { key: rect } 交换前：内容标识 → 位置
   * @param {Function} getKey (el) => 内容标识
   * @param {Element[]} els 交换后的元素
   * @param {Object} [opts]
   */
  function flipByKey(before, getKey, els, opts) {
    if (reduceMotion()) return;
    var dur = (opts && opts.duration) || 420;
    els.forEach(function (el) {
      var key = getKey(el);
      var old = key && before[key];
      if (!old) return;
      var r = el.getBoundingClientRect();
      var dx = Math.round(old.x - r.left);
      var dy = Math.round(old.y - r.top);
      if (!dx && !dy) return;
      el.animate(
        [{ transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' }, { transform: 'none' }],
        { duration: dur, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' }
      );
    });
  }

  /* ============================================================
     3) 图片：先显示 LQIP，高清图进入视口前 200px 才加载
     ============================================================ */
  var lazyObserver = null;

  function makeLazyObserver() {
    if (lazyObserver) return lazyObserver;
    lazyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        lazyObserver.unobserve(entry.target);
        loadImage(entry.target);
      });
    }, { rootMargin: '200px 0px' });   // 进入视口前 200px 开始加载
    return lazyObserver;
  }

  function loadImage(img) {
    var src = img.getAttribute('data-src');
    var srcset = img.getAttribute('data-srcset');
    if (!src && !srcset) return;
    img.removeAttribute('data-src');
    img.removeAttribute('data-srcset');
    if (srcset) img.setAttribute('srcset', srcset);
    if (src) img.setAttribute('src', src);

    if (img.complete && img.naturalWidth) { img.classList.add('is-loaded'); return; }
    img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
    // 失败就保留底下的 LQIP，不会出现破图
    img.addEventListener('error', function () { img.classList.add('is-failed'); }, { once: true });
  }

  /**
   * 给容器里所有还没加载的高清图挂上「提前 200px 加载」
   * @param {Element|Document} root
   */
  function lazyImages(root) {
    var scope = root || document;
    var imgs = [].slice.call(scope.querySelectorAll('img[data-src], img[data-srcset]'));
    if (!imgs.length) return;
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(loadImage);
      return;
    }
    var io = makeLazyObserver();
    imgs.forEach(function (img) { io.observe(img); });
  }

  window.Motion = {
    reveal: reveal,
    flip: flip,
    flipByKey: flipByKey,
    lazyImages: lazyImages,
    reduceMotion: reduceMotion
  };

  /* ============================================================
     自动初始化：页面上只要有 [data-reveal] / 待加载图片就接管，
     静态页面（工坊、文章页）不用各自写脚本
     ============================================================ */
  function autoInit() {
    if (document.querySelector('[data-reveal]')) reveal(document);
    if (document.querySelector('img[data-src]')) lazyImages(document);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})();
