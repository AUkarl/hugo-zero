// ============================================================
// archive.js - 归档页功能：时间刻度尺、文章列表、弹幕标签云、搜索筛选
// 适用于 Hugo 主题，文章数据由模板注入到 #archiveData
// 刻度尺本体见 archive-timeline.js
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // ==================== 读取归档配置 ====================
  const archiveCfg = window.archiveConfig || {};
  const groupByYear = archiveCfg.groupByYear !== false;
  const enableDanmaku = archiveCfg.enableDanmaku !== false;
  const danmakuLanes = archiveCfg.danmakuLanes || 6;

  // ==================== 读取文章数据 ====================
  let archiveData = [];
  const dataEl = document.getElementById('archiveData');
  if (dataEl) {
    try {
      archiveData = JSON.parse(dataEl.textContent);
      archiveData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      archiveData = [];
    }
  }

  // ==================== 多语言字段获取 ====================
  function getPageLang() {
    return (document.documentElement.lang || 'zh').substring(0, 2);
  }

  function loc(item, field) {
    const lang = getPageLang();
    if (lang === 'en') {
      if (item[field + 'En']) return item[field + 'En'];
    } else {
      if (item[field + 'Zh']) return item[field + 'Zh'];
    }
    return item[field] || '';
  }

  function locArray(item, field) {
    const lang = getPageLang();
    if (lang === 'en') {
      if (Array.isArray(item[field + 'En']) && item[field + 'En'].length > 0) return item[field + 'En'];
    } else {
      if (Array.isArray(item[field + 'Zh']) && item[field + 'Zh'].length > 0) return item[field + 'Zh'];
    }
    return item[field] || [];
  }

  function locPermalink(item) {
    const lang = getPageLang();
    if (lang === 'en' && item.permalinkEn) return item.permalinkEn;
    if (lang === 'zh' && item.permalinkZh) return item.permalinkZh;
    return item.permalink || '#';
  }

  // 取当前语言的界面文案（模板注入的 i18nMap）
  function t(key, fallback) {
    const lang = getPageLang();
    const map = window.i18nMap && window.i18nMap[lang];
    return (map && map[key]) || fallback;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function countLabel(n) {
    const tpl = (n === 1 ? t('archive-month-count-one', '') : '') || t('archive-month-count', '%d 篇');
    return tpl.replace('%d', n);
  }

  function navHeight() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--nav-height');
    return parseInt(v, 10) || 64;
  }

  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ==================== 统计分类/标签数量 ====================
  function getArchiveCounts(items, key) {
    const map = new Map();
    items.forEach(item => {
      const val = (key === 'tags') ? locArray(item, key) : loc(item, key);
      if (Array.isArray(val)) {
        val.forEach(v => { map.set(v, (map.get(v) || 0) + 1); });
      } else if (val) {
        map.set(val, (map.get(val) || 0) + 1);
      }
    });
    return map;
  }

  // ==================== 按「年-月」分组 ====================
  function groupByMonth(items) {
    const map = new Map();
    items.forEach(item => {
      const key = String(item.date).substring(0, 7);      // YYYY-MM
      if (!/^\d{4}-\d{2}$/.test(key)) return;
      let g = map.get(key);
      if (!g) {
        g = { key: key, year: key.substring(0, 4), month: parseInt(key.substring(5, 7), 10), count: 0, posts: [] };
        map.set(key, g);
      }
      g.posts.push(item);
      g.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }

  // ==================== 渲染文章列表 + 刻度尺 ====================
  let timelineBound = false;
  let spyKey = null;
  let spyLockUntil = 0;

  function renderArchive(filter, searchText) {
    const wrapperEl = document.querySelector('.archive-wrapper');
    const listEl = document.getElementById('archiveList');
    if (!listEl) return;

    let filtered = archiveData;
    if (filter) {
      if (filter.type === 'category') {
        filtered = filtered.filter(item => loc(item, 'category') === filter.value);
      } else if (filter.type === 'tag') {
        filtered = filtered.filter(item => locArray(item, 'tags').includes(filter.value));
      }
    }
    if (searchText && searchText.trim() !== '') {
      const s = searchText.trim().toLowerCase();
      filtered = filtered.filter(item =>
        loc(item, 'title').toLowerCase().includes(s) ||
        loc(item, 'category').toLowerCase().includes(s) ||
        locArray(item, 'tags').some(tag => tag.toLowerCase().includes(s))
      );
    }

    /* ---------- 不分组：退回原来的平铺列表 ---------- */
    if (!groupByYear) {
      const sorted = filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      listEl.innerHTML = sorted.length
        ? sorted.map(item => `
            <a class="archive-item" href="${locPermalink(item) || '#'}">
              <span class="date">${item.date}</span>
              <span class="title">${esc(loc(item, 'title'))}</span>
            </a>`).join('')
        : '<div class="archive-empty">' + esc(t('archive-empty', '没有匹配的文章')) + '</div>';
      if (wrapperEl) wrapperEl.classList.add('is-flat');
      return;
    }

    const groups = groupByMonth(filtered);

    /* ---------- 中间：按年月分组的连续列表（年份/月份在分组小标题里，条目只显示月-日） ---------- */
    listEl.innerHTML = groups.length
      ? groups.map(g => `
          <section class="archive-month" id="m-${g.key}" data-key="${g.key}">
            <div class="archive-month-head">
              <span class="ym">${g.year} · ${String(g.month).padStart(2, '0')}</span>
              <span class="cnt">${esc(countLabel(g.count))}</span>
            </div>
            ${g.posts.map(item => `
              <a class="archive-item" href="${locPermalink(item) || '#'}">
                <span class="date">${String(item.date).substring(5)}</span>
                <span class="title">${esc(loc(item, 'title'))}</span>
              </a>`).join('')}
          </section>`).join('')
      : '<div class="archive-empty">' + esc(t('archive-empty', '没有匹配的文章')) + '</div>';

    if (wrapperEl) {
      wrapperEl.classList.toggle('is-empty', groups.length === 0);
    }

    /* ---------- 左侧：时间刻度尺（+ 移动端月份条） ---------- */
    if (window.ArchiveTimeline) {
      window.ArchiveTimeline.render(
        groups.map(g => ({ key: g.key, year: Number(g.year), month: g.month, count: g.count })),
        {
          lang: getPageLang(),
          formatCount: countLabel,
          onPick: function (key) { scrollToMonth(key, true); }
        }
      );
    }

    spyKey = groups.length ? groups[0].key : null;
    spyLockUntil = performance.now() + 400;
    pickKey = null;
    pickScrollY = NaN;
    pickWatching = false;

    if (!timelineBound) {
      timelineBound = true;
      window.addEventListener('scroll', onPageScroll, { passive: true });
    }
  }

  // ==================== 点击刻度尺 → 滚动文章列表 ====================
  let pickKey = null;
  let pickScrollY = NaN;
  let pickWatching = false;

  // 等页面滚动静止（连续 3 帧不变）后再回调，避免把动画中途的位置当成终点
  function watchScrollSettle(cb) {
    let lastY = -1, stable = 0, frames = 0;
    (function step() {
      const y = Math.round(window.scrollY);
      if (y === lastY) stable++; else { stable = 0; lastY = y; }
      frames++;
      if (stable >= 3 || frames > 180) { cb(y); return; }
      requestAnimationFrame(step);
    })();
  }

  function scrollToMonth(key, user) {
    const target = document.getElementById('m-' + key);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight() - 18;
    const y = Math.max(0, Math.round(top));
    if (Math.abs(window.scrollY - y) > 2) {
      window.scrollTo({ top: y, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
    if (user) {
      flash(target);
      spyKey = key;
      pickKey = key;
      pickWatching = true;
      spyLockUntil = performance.now() + 1400;
      watchScrollSettle(function (settledY) {
        pickScrollY = settledY;
        pickWatching = false;
      });
    }
  }

  // 落到目标月份时轻轻闪一下，让眼睛有个落点
  let flashTimer = null;
  function flash(el) {
    const head = el.querySelector('.archive-month-head');
    if (!head || reduceMotion()) return;
    if (flashTimer) clearTimeout(flashTimer);
    document.querySelectorAll('.archive-month-head.is-flash').forEach((h) => h.classList.remove('is-flash'));
    // 强制回流，保证连续点击时动画能重放
    void head.offsetWidth;
    head.classList.add('is-flash');
    flashTimer = setTimeout(function () {
      head.classList.remove('is-flash');
      flashTimer = null;
    }, 900);
  }

  // ==================== 页面滚动 → 刻度尺高亮当前月份 ====================
  let spyTicking = false;

  function keyAtScroll() {
    const heads = document.querySelectorAll('.archive-month');
    if (!heads.length) return null;
    const ref = navHeight() + 120;
    let passed = null;
    let firstVisible = null;
    for (let i = 0; i < heads.length; i++) {
      const r = heads[i].getBoundingClientRect();
      if (r.top - ref <= 0) passed = heads[i].dataset.key;
      else if (!firstVisible && r.bottom > 0) firstVisible = heads[i].dataset.key;
    }
    // 参考线以上没有月份（页面刚打开，或已滚到底部）时，取当前可见的第一个月份
    return passed || firstVisible || heads[0].dataset.key;
  }

  function onPageScroll() {
    if (spyTicking) return;
    spyTicking = true;
    requestAnimationFrame(function () {
      spyTicking = false;
      if (pickWatching) return;                       // 点击导致的滚动动画还没停
      if (performance.now() < spyLockUntil) return;
      const key = keyAtScroll();
      if (!key || key === spyKey) return;
      // 页面已经滚到头、位置和「用户选择」时一样：说明这个月顶不到参考线，
      // 保留用户的选择，不要反抢（用户一动滚动条就不再拦截）
      if (pickKey && key !== pickKey &&
          Math.abs(Math.round(window.scrollY) - pickScrollY) <= 2) return;
      spyKey = key;
      pickKey = null;
      if (window.ArchiveTimeline) window.ArchiveTimeline.setActiveKey(key);
    });
  }

  // ==================== 渲染侧边栏（分类云 + 弹幕标签云） ====================
  function renderArchiveSidebar() {
    const catCloud = document.getElementById('categoryCloud');
    const danmakuEl = document.getElementById('tagDanmaku');

    if (catCloud) {
      const catCounts = getArchiveCounts(archiveData, 'category');
      const allText = (window.i18nMap && window.i18nMap[getPageLang()] && window.i18nMap[getPageLang()]['archive-all']) || 'All';
      let catHtml = `<span class="cloud-item active-filter" data-type="category" data-value="all">${allText} <span class="count">${archiveData.length}</span></span>`;
      for (const [cat, count] of catCounts) {
        catHtml += `<span class="cloud-item" data-type="category" data-value="${cat}">${cat} <span class="count">${count}</span></span>`;
      }
      catCloud.innerHTML = catHtml;
    }

    if (danmakuEl && enableDanmaku) {
      const tagCounts = getArchiveCounts(archiveData, 'tags');
      const tagArr = Array.from(tagCounts);
      for (let i = tagArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tagArr[i], tagArr[j]] = [tagArr[j], tagArr[i]];
      }

      const laneCount = danmakuLanes;
      const lanes = Array.from({ length: laneCount }, () => []);
      tagArr.forEach((item, idx) => {
        lanes[idx % laneCount].push(item);
      });

      const durations = [10, 14, 12, 18, 11, 16];
      let danmakuHtml = '';
      lanes.forEach((laneTags, i) => {
        if (laneTags.length === 0) return;
        const dir = 'normal';
        const dur = durations[i % durations.length] + Math.floor(Math.random() * 4);
        let itemsHtml = '';
        laneTags.forEach(([tag, count]) => {
          itemsHtml += `<span class="cloud-item" data-type="tag" data-value="${tag}">#${tag} <span class="count">${count}</span></span>`;
        });
        danmakuHtml += `<div class="danmaku-lane" style="--duration:${dur}s;--direction:${dir}">${itemsHtml}${itemsHtml}</div>`;
      });
      danmakuEl.innerHTML = danmakuHtml;
    }

    document.querySelectorAll('#categoryCloud .cloud-item, #tagDanmaku .cloud-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const type = this.dataset.type;
        const value = this.dataset.value;

        if (type === 'tag') {
          document.querySelectorAll('#tagDanmaku .cloud-item').forEach(el => el.classList.remove('active-filter'));
        } else {
          document.querySelectorAll('#categoryCloud .cloud-item').forEach(el => el.classList.remove('active-filter'));
        }
        this.classList.add('active-filter');

        if (type === 'category') {
          document.querySelectorAll('#tagDanmaku .cloud-item').forEach(el => el.classList.add('active-filter'));
        } else {
          document.querySelectorAll('#categoryCloud .cloud-item').forEach(el => el.classList.remove('active-filter'));
          const allCat = document.querySelector('#categoryCloud .cloud-item[data-value="all"]');
          if (allCat) allCat.classList.add('active-filter');
        }

        const searchInput = document.getElementById('archiveSearch');
        if (searchInput) searchInput.value = '';

        if (value === 'all') {
          renderArchive(null, '');
        } else {
          renderArchive({ type: type, value: value }, '');
        }
      });
    });
  }

  // ==================== 搜索事件绑定 ====================
  const searchInput = document.getElementById('archiveSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      document.querySelectorAll('#categoryCloud .cloud-item').forEach(el => el.classList.remove('active-filter'));
      const allCat = document.querySelector('#categoryCloud .cloud-item[data-value="all"]');
      if (allCat) allCat.classList.add('active-filter');
      document.querySelectorAll('#tagDanmaku .cloud-item').forEach(el => el.classList.remove('active-filter'));
      renderArchive(null, this.value);
    });
  }

  // ==================== 初始渲染 ====================
  renderArchive();
  renderArchiveSidebar();

  // 语言切换后重新渲染
  document.addEventListener('langApplied', function() {
    renderArchive();
    renderArchiveSidebar();
  });

});
