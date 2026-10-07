// ============================================================
// lightbox.js — 图片点击放大查看
//   · 作用范围：文章正文（.article-body）、时刻卡片（.shuo-item 里的配图/正文媒体）
//     以及显式写了 data-lightbox 的容器
//   · 同一次查看只在「同一篇文章」或「同一条时刻」的图片之间左右切换
//   · 支持：左右按钮、键盘 ←/→、移动端左右滑动、Esc / 点背景 / 关闭按钮退出
//   · 点图片不再跳转外链（时刻页的图片外层是按钮，本来就不跳）
// ============================================================
(function () {
  'use strict';

  // 分组规则：命中的图片 = 可放大查看，切换范围 = 同一 scope
  var RULES = [
    { img: '.shuo-images img, .shuo-media img', scope: '.shuo-item' },
    { img: '.article-body img', scope: '.article-body' },
    { img: '[data-lightbox] img', scope: '[data-lightbox]' }
  ];

  var cur = document.currentScript;
  var T = {
    close: (cur && cur.dataset.close) || '关闭',
    prev: (cur && cur.dataset.prev) || '上一张',
    next: (cur && cur.dataset.next) || '下一张',
    view: (cur && cur.dataset.view) || '查看大图'
  };

  var box = null, imgEl = null, countEl = null, list = [], idx = 0, opener = null, touchX = 0;

  function source(img) {
    // 原图优先（构建时写进 data-orig），其次懒加载的 data-src，最后当前 src
    return img.getAttribute('data-orig') || img.getAttribute('data-src') || img.currentSrc || img.src || '';
  }

  function ruleFor(img) {
    for (var i = 0; i < RULES.length; i++) {
      if (img.matches && img.matches(RULES[i].img)) {
        var scope = img.closest(RULES[i].scope);
        if (scope) return { rule: RULES[i], scope: scope };
      }
    }
    return null;
  }

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.innerHTML =
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="' + T.close + '">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="' + T.prev + '">&#8249;</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="' + T.next + '">&#8250;</button>' +
      '<span class="lightbox-count" aria-hidden="true"></span>';
    document.body.appendChild(box);
    imgEl = box.querySelector('.lightbox-img');
    countEl = box.querySelector('.lightbox-count');

    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    box.querySelector('.lightbox-next').addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    imgEl.addEventListener('click', function (e) { e.stopPropagation(); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    // 移动端左右滑动
    box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40 && list.length > 1) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function show(i) {
    idx = (i + list.length) % list.length;
    var src = source(list[idx]);
    imgEl.src = src;
    imgEl.alt = list[idx].getAttribute('alt') || '';
    countEl.textContent = list.length > 1 ? (idx + 1) + ' / ' + list.length : '';
    var multi = list.length > 1;
    box.querySelector('.lightbox-prev').hidden = !multi;
    box.querySelector('.lightbox-next').hidden = !multi;
    // 预加载相邻两张
    [-1, 1].forEach(function (d) {
      if (!multi) return;
      var n = list[(idx + d + list.length) % list.length];
      var s = source(n);
      if (s) { var im = new Image(); im.src = s; }
    });
  }

  function go(d) { show(idx + d); }

  function open(img) {
    var found = ruleFor(img);
    if (!found) return;
    list = Array.prototype.slice.call(found.scope.querySelectorAll(found.rule.img)).filter(function (i) {
      var s = source(i);
      return s && !/\.svg(\?|$)/i.test(s);       // 图标不算
    });
    if (!list.length) return;
    if (!box) build();
    opener = img;
    box.hidden = false;
    document.body.classList.add('lightbox-open');
    show(Math.max(0, list.indexOf(img)));
    box.querySelector('.lightbox-close').focus();
  }

  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    imgEl.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (opener && opener.focus) { try { opener.focus(); } catch (e) { /* 忽略 */ } }
  }

  document.addEventListener('click', function (e) {
    var img = e.target && e.target.tagName === 'IMG' ? e.target : null;
    if (!img || !ruleFor(img)) return;
    // 图片外层可能是链接：拦掉跳转，改成放大查看
    var a = img.closest('a');
    if (a) e.preventDefault();
    e.stopPropagation();
    open(img);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!box || box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  });
})();
