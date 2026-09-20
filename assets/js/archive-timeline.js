// ============================================================
// archive-timeline.js — 归档页左侧「时间刻度尺」
// ------------------------------------------------------------
// 结构（由 layouts/archive/list.html 提供骨架）：
//   #archiveTimeline > .tl-ruler > .tl-viewport > .tl-track > svg / .tl-years / .tl-nodes
//   #archiveTimeline > .tl-chips                      （移动端月份快捷条）
//
// 交互：
//   · 在刻度尺上滚轮 / 拖拽 → 只滚动刻度尺本身（带惯性、松手吸附到最近月份）
//   · 停下后回调 onPick(key)，由 archive.js 把中间的文章列表平滑滚到该月份
//   · 点击某个刻度 / 移动端点击月份条 → 立即切换
//   · 刻度尺获得焦点时可用 ↑ ↓ PageUp PageDown Home End 切换
//   · 页面滚动时由 archive.js 调 setActiveKey()，刻度尺平滑跟到该月份
//
// 视觉（参考「焦点刻度尺」做法）：
//   · 主轴按年份断开，年份数字落在断口里
//   · 每个月份一条刻度线 + 圆点，越靠近焦点越长、点越大、文字越清晰
//   · 焦点处有淡薄荷色光晕，当前刻度用强调色 + 发光
//   · 顶部/底部用 mask 渐隐，避免出现硬边
// ============================================================
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ===== 可调参数 ===== */
  var TICK_MIN = 10;          // 边缘刻度长度
  var TICK_MAX = 26;          // 焦点刻度长度
  var TEXT_GAP = 14;          // 圆点到月份文字的间距
  var GAP_TOP = 132;          // 年份断口上沿（距节点）
  var GAP_BOTTOM = 56;        // 年份断口下沿（距节点）
  var FOCUS_RANGE = 0.42;     // 焦点范围（占视口高度比例）
  var CENTER_RATIO = 0.46;    // 焦点线位置（占视口高度比例）
  var EASE = 0.14;            // 普通平滑系数
  var EASE_DRAG = 0.42;       // 拖拽跟随系数
  var WHEEL_RATE = 0.9;       // 滚轮灵敏度
  var SETTLE_DELAY = 150;     // 停下多久后联动文章列表
  var LOCK_MS = 900;          // 联动滚动期间屏蔽滚动反抢

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ===== 状态 ===== */
  var dom = {};
  var months = [];        // [{ key, year, month, count, label }]
  var nodes = [];         // [{ y, tick, dot, nodeEl, hit, key }]
  var yearEls = [];       // [{ el, y }]
  var chipEls = {};       // key -> chip
  var opts = { lang: 'zh', countLabel: '%d 篇', onPick: null };

  var viewH = 0, spacing = 96, maxOffset = 0, minOffset = 0;
  var current = 0, target = 0;
  var visual = -1;        // 视觉高亮（离焦点线最近）
  var selected = -1;      // 已提交的月份
  var rafId = null, lastTime = 0;
  var dragging = false, dragMoved = false, dragStartY = 0, dragStartOffset = 0;
  var lastPointerY = 0, lastPointerTime = 0, velocity = 0;
  var settleTimer = null;
  var lockUntil = 0;
  var ready = false;

  /* ============================================================
     工具
     ============================================================ */
  function monthName(month) {
    if (opts.lang === 'en') return MONTH_EN[month - 1] || String(month);
    return month + '月';
  }

  // 篇数文案：archive.js 会传进来一个格式化函数（英文单复数不同）
  function countText(n) {
    if (typeof opts.formatCount === 'function') return opts.formatCount(n);
    return String(opts.countLabel || '%d').replace('%d', n);
  }

  function fullLabel(m) {
    var name = m.year + ' · ' + String(m.month).padStart(2, '0');
    return name + '　' + countText(m.count);
  }

  function select(sel, root) { return (root || document).querySelector(sel); }

  /* ============================================================
     构建 DOM
     ============================================================ */
  function cache() {
    dom.root = document.getElementById('archiveTimeline');
    dom.ruler = document.getElementById('tlRuler');
    dom.viewport = document.getElementById('tlViewport');
    dom.track = document.getElementById('tlTrack');
    dom.svg = document.getElementById('tlSvg');
    dom.years = document.getElementById('tlYears');
    dom.nodes = document.getElementById('tlNodes');
    dom.chips = document.getElementById('tlChips');
  }

  function clearSvg() {
    while (dom.svg.firstChild) dom.svg.removeChild(dom.svg.firstChild);
  }

  function makeSvg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function build() {
    if (!ready || !dom.viewport) return;

    var n = months.length;
    if (!n) {
      clearSvg();
      dom.years.innerHTML = '';
      dom.nodes.innerHTML = '';
      dom.track.style.transform = 'translate3d(0,0,0)';
      nodes = [];
      yearEls = [];
      return;
    }

    viewH = dom.viewport.clientHeight || 320;
    spacing = clamp(Math.round(viewH / 6.2), 72, 112);
    var padTop = Math.round(viewH * CENTER_RATIO) + Math.round(spacing * 0.6);

    nodes = months.map(function (m, i) {
      return {
        key: m.key,
        y: padTop + i * spacing,
        isYearStart: i === 0 || months[i - 1].year !== m.year
      };
    });

    var totalH = padTop + (n - 1) * spacing + viewH;

    /* ---------- SVG 画布 ---------- */
    var svgW = TICK_MAX + 8;
    dom.svg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + totalH);
    dom.svg.setAttribute('width', svgW);
    dom.svg.setAttribute('height', totalH);
    dom.svg.style.width = svgW + 'px';
    dom.svg.style.height = totalH + 'px';
    clearSvg();

    /* ---------- 主轴（年份处断开） ---------- */
    var firstY = nodes[0].y, lastY = nodes[n - 1].y;
    var segments = [];
    var segStart = firstY - 260;
    nodes.forEach(function (nd) {
      if (!nd.isYearStart) return;
      var gapTop = nd.y - GAP_TOP;
      var gapBottom = nd.y - GAP_BOTTOM;
      if (gapTop > segStart) segments.push([segStart, gapTop]);
      segStart = gapBottom;
    });
    segments.push([segStart, lastY + 200]);
    segments.forEach(function (seg) {
      dom.svg.appendChild(makeSvg('line', {
        class: 'tl-axis', x1: 0, y1: seg[0], x2: 0, y2: seg[1]
      }));
    });

    /* ---------- 刻度线 + 圆点 ---------- */
    nodes.forEach(function (nd) {
      nd.tick = makeSvg('line', {
        class: 'tl-tick-line', x1: 0, y1: nd.y, x2: TICK_MIN, y2: nd.y
      });
      nd.dot = makeSvg('circle', {
        class: 'tl-tick-dot', cx: TICK_MIN, cy: nd.y, r: 2
      });
      dom.svg.appendChild(nd.tick);
      dom.svg.appendChild(nd.dot);
    });

    /* ---------- 年份文字（落在断口里） ---------- */
    dom.years.innerHTML = '';
    yearEls = [];
    months.forEach(function (m, i) {
      if (!nodes[i].isYearStart) return;
      var y = nodes[i].y - (GAP_TOP + GAP_BOTTOM) / 2;
      var el = document.createElement('div');
      el.className = 'tl-year-label';
      el.style.top = y + 'px';
      el.textContent = String(m.year);
      dom.years.appendChild(el);
      yearEls.push({ el: el, y: y });
    });

    /* ---------- 月份节点 ---------- */
    dom.nodes.innerHTML = '';
    months.forEach(function (m, i) {
      var nd = nodes[i];
      var el = document.createElement('div');
      el.className = 'tl-node';
      el.id = 'tl-node-' + m.key;
      el.dataset.key = m.key;
      el.style.top = nd.y + 'px';
      el.innerHTML =
        '<span class="tl-month-text" style="left:' + (TICK_MAX + TEXT_GAP) + 'px">' +
          monthName(m.month) +
          '<span class="tl-month-count">' + countText(m.count) + '</span>' +
        '</span>' +
        '<span class="tl-hit" style="left:0;width:' + (TICK_MAX + 190) + 'px"></span>';

      var hit = el.querySelector('.tl-hit');
      hit.setAttribute('role', 'button');
      hit.setAttribute('tabindex', '-1');
      hit.setAttribute('aria-label', fullLabel(m));
      hit.addEventListener('click', function (e) {
        if (dragMoved) return;
        e.stopPropagation();
        pick(i, true);
      });

      nd.nodeEl = el;
      nd.hit = hit;
      dom.nodes.appendChild(el);
    });

    /* ---------- 滚动范围 ---------- */
    var centerY = viewH * CENTER_RATIO;
    maxOffset = centerY - nodes[0].y;
    minOffset = centerY - nodes[n - 1].y;
    if (minOffset > maxOffset) {
      var mid = (maxOffset + minOffset) / 2;
      maxOffset = minOffset = mid;
    }

    /* 保持当前月份居中 */
    var keep = selected >= 0 ? clamp(selected, 0, n - 1) : 0;
    target = clamp(centerY - nodes[keep].y, minOffset, maxOffset);
    current = target;
    visual = keep;
    applyTransform();
    updateVisuals(true);
    syncChips(keep);
  }

  function applyTransform() {
    dom.track.style.transform = 'translate3d(0,' + current.toFixed(2) + 'px,0)';
  }

  /* ============================================================
     每帧：平滑 + 视觉
     ============================================================ */
  function loop(now) {
    var dtMs = Math.min(now - lastTime, 48);
    lastTime = now;
    var dt = dtMs / 16.667;

    var diff = target - current;
    if (Math.abs(diff) < 0.08) {
      current = target;
    } else {
      var ease = dragging ? EASE_DRAG : EASE;
      current += diff * (1 - Math.pow(1 - ease, dt));
    }
    applyTransform();
    updateVisuals(false);

    if (dragging || Math.abs(target - current) > 0.08) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  function kick() {
    if (rafId) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function updateVisuals(force) {
    if (!nodes.length) return;
    var centerY = viewH * CENTER_RATIO;
    var range = Math.max(60, viewH * FOCUS_RANGE);
    var best = 0, bestDist = Infinity;

    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var screenY = current + nd.y;
      var dist = Math.abs(screenY - centerY);
      if (dist < bestDist) { bestDist = dist; best = i; }

      var f = smoothstep(clamp(1 - dist / range, 0, 1));
      var len = TICK_MIN + (TICK_MAX - TICK_MIN) * f;
      nd.tick.setAttribute('x2', len.toFixed(2));
      nd.dot.setAttribute('cx', len.toFixed(2));
      nd.dot.setAttribute('r', (1.8 + 2.6 * f).toFixed(2));
      nd.nodeEl.style.opacity = (0.3 + 0.7 * f).toFixed(3);
    }

    for (var j = 0; j < yearEls.length; j++) {
      var ye = yearEls[j];
      var d = Math.abs(current + ye.y - centerY);
      ye.el.style.opacity = Math.max(0.24, 1 - d / (viewH * 0.7)).toFixed(3);
    }

    if (best !== visual || force) {
      if (visual >= 0 && nodes[visual]) {
        nodes[visual].tick.classList.remove('is-active');
        nodes[visual].dot.classList.remove('is-active');
        nodes[visual].nodeEl.classList.remove('is-active');
      }
      nodes[best].tick.classList.add('is-active');
      nodes[best].dot.classList.add('is-active');
      nodes[best].nodeEl.classList.add('is-active');
      if (dom.ruler) dom.ruler.setAttribute('aria-activedescendant', 'tl-node-' + months[best].key);
      visual = best;
      syncChips(best);
    }
  }

  /* ============================================================
     选择 / 联动
     ============================================================ */
  function pick(i, user) {
    if (!nodes.length) return;
    i = clamp(i, 0, nodes.length - 1);
    target = clamp(viewH * CENTER_RATIO - nodes[i].y, minOffset, maxOffset);
    if (reduceMotion()) current = target;
    kick();

    if (user) {
      visual = i;
      commit(i);
    }
  }

  // 停下后把「当前月份」交给 archive.js（用来滚动文章列表）
  function commit(i) {
    selected = i;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      settleTimer = null;
      lockUntil = performance.now() + LOCK_MS;
      if (opts.onPick) opts.onPick(months[i].key, i);
    }, SETTLE_DELAY);
  }

  // 离焦点线最近的月份（用 target 判断：动画中 current 还在追，target 才是用户滚到的位置）
  function nearestIndex() {
    if (!nodes.length) return -1;
    var centerY = viewH * CENTER_RATIO;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var d = Math.abs(target + nodes[i].y - centerY);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  /* ============================================================
     悬停反馈
     ============================================================ */
  var hoverIdx = -1;

  function setHover(i) {
    if (i === hoverIdx) return;
    if (hoverIdx >= 0 && nodes[hoverIdx]) {
      nodes[hoverIdx].nodeEl.classList.remove('is-hover');
      nodes[hoverIdx].tick.classList.remove('is-hover');
      nodes[hoverIdx].dot.classList.remove('is-hover');
    }
    hoverIdx = i;
    if (i >= 0 && nodes[i]) {
      nodes[i].nodeEl.classList.add('is-hover');
      nodes[i].tick.classList.add('is-hover');
      nodes[i].dot.classList.add('is-hover');
    }
  }

  function clearHover() { setHover(-1); }

  function updateHover(clientY) {
    if (!nodes.length || !dom.viewport) return;
    var rect = dom.viewport.getBoundingClientRect();
    var trackY = clientY - rect.top - current;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < nodes.length; i++) {
      var d = Math.abs(nodes[i].y - trackY);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
  }

  /* ============================================================
     移动端月份条
     ============================================================ */
  function renderChips() {
    if (!dom.chips) return;
    chipEls = {};
    var html = months.map(function (m, i) {
      return '<button type="button" class="tl-chip" data-index="' + i + '" data-key="' + m.key + '">' +
        '<span class="tl-chip-m">' + monthName(m.month) + '</span>' +
        '<span class="tl-chip-n">' + countText(m.count) + '</span>' +
        '</button>';
    }).join('');
    dom.chips.innerHTML = html;
    Array.prototype.forEach.call(dom.chips.querySelectorAll('.tl-chip'), function (btn) {
      btn.addEventListener('click', function () {
        pick(Number(btn.dataset.index), true);
      });
      chipEls[btn.dataset.key] = btn;
    });
  }

  function syncChips(i) {
    if (!dom.chips || i < 0 || !months[i]) return;
    var key = months[i].key;
    Array.prototype.forEach.call(dom.chips.querySelectorAll('.tl-chip'), function (btn) {
      btn.classList.toggle('is-active', btn.dataset.key === key);
    });
    var cur = chipEls[key];
    if (cur && dom.chips.scrollWidth > dom.chips.clientWidth) {
      var left = cur.offsetLeft - (dom.chips.clientWidth - cur.offsetWidth) / 2;
      if (dom.chips.scrollTo) {
        dom.chips.scrollTo({ left: left, behavior: reduceMotion() ? 'auto' : 'smooth' });
      } else {
        dom.chips.scrollLeft = left;
      }
    }
  }

  /* ============================================================
     事件
     ============================================================ */
  function bind() {
    /* 滚轮：只滚动刻度尺；滚到两端之后把滚动交回页面，避免「卡住」的感觉 */
    dom.viewport.addEventListener('wheel', function (e) {
      if (!ready) return;
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 18;
      else if (e.deltaMode === 2) d *= viewH;
      var next = clamp(target - d * WHEEL_RATE, minOffset, maxOffset);
      var atEnd = Math.abs(next - target) < 0.5 &&
                  ((d > 0 && target <= minOffset + 0.5) || (d < 0 && target >= maxOffset - 0.5));
      if (atEnd) return;                     // 交给页面自己滚
      e.preventDefault();
      target = next;
      kick();
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        settleTimer = null;
        // 停下后吸附到最近月份，保证高亮刻度正好落在焦点线上
        pick(nearestIndex(), true);
      }, SETTLE_DELAY);
    }, { passive: false });

    /* 拖拽 */
    dom.viewport.addEventListener('pointerdown', function (e) {
      if (!ready) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      dragMoved = false;
      dragStartY = e.clientY;
      dragStartOffset = target;
      lastPointerY = e.clientY;
      lastPointerTime = performance.now();
      velocity = 0;
      clearHover();
      dom.viewport.classList.add('is-dragging');
      try { dom.viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      kick();
    });

    dom.viewport.addEventListener('pointermove', function (e) {
      if (!dragging) {
        updateHover(e.clientY);
        return;
      }
      var now = performance.now();
      var dy = e.clientY - lastPointerY;
      var dt = now - lastPointerTime;
      if (dt > 0) velocity = velocity * 0.68 + (dy / dt) * 16 * 0.32;
      lastPointerY = e.clientY;
      lastPointerTime = now;

      var total = e.clientY - dragStartY;
      if (Math.abs(total) > 4) dragMoved = true;
      target = clamp(dragStartOffset + total, minOffset, maxOffset);
      kick();
    });

    dom.viewport.addEventListener('pointerleave', clearHover);

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      dom.viewport.classList.remove('is-dragging');
      try { dom.viewport.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      /* 没有拖动 → 当成一次点击：选中离指针最近的那个月份
         （pointer capture 会把 click 事件吞掉，所以这里自己判定） */
      if (!dragMoved) {
        var rect = dom.viewport.getBoundingClientRect();
        var trackY = e.clientY - rect.top - current;
        var hit = 0, hitDist = Infinity;
        for (var k = 0; k < nodes.length; k++) {
          var dk = Math.abs(nodes[k].y - trackY);
          if (dk < hitDist) { hitDist = dk; hit = k; }
        }
        pick(hit, true);
        velocity = 0;
        return;
      }

      if (Math.abs(velocity) > 0.7) {
        target = clamp(target + velocity * 12, minOffset, maxOffset);
      }
      // 松手吸附到最近月份
      var centerY = viewH * CENTER_RATIO;
      var best = 0, bestDist = Infinity;
      for (var i = 0; i < nodes.length; i++) {
        var d = Math.abs(target + nodes[i].y - centerY);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      target = clamp(centerY - nodes[best].y, minOffset, maxOffset);
      kick();
      commit(best);
      velocity = 0;
      setTimeout(function () { dragMoved = false; }, 0);
    }

    dom.viewport.addEventListener('pointerup', endDrag);
    dom.viewport.addEventListener('pointercancel', endDrag);

    /* 键盘（刻度尺获得焦点时） */
    dom.ruler.addEventListener('keydown', function (e) {
      if (!ready || !nodes.length) return;
      var i = visual < 0 ? 0 : visual;
      var handled = true;
      switch (e.key) {
        case 'ArrowDown': case 'j': i = i + 1; break;
        case 'ArrowUp': case 'k': i = i - 1; break;
        case 'PageDown': i = i + 3; break;
        case 'PageUp': i = i - 3; break;
        case 'Home': i = 0; break;
        case 'End': i = nodes.length - 1; break;
        default: handled = false;
      }
      if (!handled) return;
      e.preventDefault();
      pick(clamp(i, 0, nodes.length - 1), true);
    });

    /* 尺寸变化：重建（保持当前月份） */
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (!ready) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resizeTimer = null; build(); }, 160);
    });
  }

  /* ============================================================
     对外接口
     ============================================================ */
  window.ArchiveTimeline = {
    // 渲染 / 重建
    render: function (list, options) {
      if (!dom.root) cache();
      if (!dom.root) return;
      months = list || [];
      if (options) {
        Object.keys(options).forEach(function (k) { opts[k] = options[k]; });
      }
      ready = true;
      selected = months.length ? 0 : -1;
      visual = -1;
      renderChips();
      build();
      if (!dom.__bound) { bind(); dom.__bound = true; }
    },

    // 页面滚动联动：只移动刻度尺与高亮，不回调 onPick
    setActiveKey: function (key) {
      if (!ready) return;
      var i = -1;
      for (var k = 0; k < months.length; k++) {
        if (months[k].key === key) { i = k; break; }
      }
      if (i < 0 || i === selected) return;
      if (performance.now() < lockUntil) return;
      selected = i;
      target = clamp(viewH * CENTER_RATIO - nodes[i].y, minOffset, maxOffset);
      if (reduceMotion()) current = target;
      kick();
    },

    destroy: function () {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      ready = false;
    }
  };
})();
