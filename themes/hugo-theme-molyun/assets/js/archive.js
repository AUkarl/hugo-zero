// ============================================================
// archive.js - 归档页功能：时间线、弹幕标签云、搜索筛选
// 适用于 Hugo 主题，文章数据由模板注入到 #archiveData
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

  // ==================== 渲染归档时间线 ====================
  function renderArchive(filter, searchText) {
    const timelineEl = document.getElementById('archiveTimeline');
    const listEl = document.getElementById('archiveList');
    if (!timelineEl || !listEl) return;

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

    let timelineHtml = '';
    let listHtml = '';

    if (groupByYear) {
      const groups = {};
      filtered.forEach(item => {
        const year = item.date.substring(0, 4);
        if (!groups[year]) groups[year] = [];
        groups[year].push(item);
      });
      const years = Object.keys(groups).sort((a, b) => b - a);

      years.forEach(year => {
        timelineHtml += `
          <div class="archive-year-marker">
            <span class="year">${year}</span>
            <span class="dot"></span>
          </div>
        `;
      });

      years.forEach(year => {
        const items = groups[year].sort((a, b) => new Date(b.date) - new Date(a.date));
        items.forEach(item => {
          listHtml += `
            <a class="archive-item" href="${locPermalink(item) || '#'}" style="text-decoration:none;color:inherit;">
              <span class="date">${item.date}</span>
              <span class="title">${loc(item, 'title')}</span>
            </a>
          `;
        });
      });
    } else {
      const sorted = filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
      sorted.forEach(item => {
        listHtml += `
          <a class="archive-item" href="${locPermalink(item) || '#'}" style="text-decoration:none;color:inherit;">
            <span class="date">${item.date}</span>
            <span class="title">${loc(item, 'title')}</span>
          </a>
        `;
      });
    }

    timelineEl.innerHTML = timelineHtml;
    listEl.innerHTML = listHtml || '<div style="padding:20px;color:var(--text-secondary);">No matching articles</div>';
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

  console.log('archive.js loaded - timeline, danmaku tag cloud, search');
});
