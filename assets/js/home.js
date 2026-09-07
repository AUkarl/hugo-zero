// ============================================================
// home.js - 首页（Home）文章卡片列表功能
// 包含：瀑布流渲染、分页、分类筛选、搜索
// 适用于 Hugo 主题，数据由模板直接渲染，无需动态加载
// ============================================================

// 分页配置（从 Hugo 模板注入的 window.homeConfig 读取）
const homeCfg = window.homeConfig || {};
const ITEMS_PER_PAGE = homeCfg.paginate || 20;
const SHOW_IMAGES = homeCfg.showImages !== false;
const SHOW_SUMMARY = homeCfg.showSummary !== false;
let currentPage = 1;
let filteredArticles = [];

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

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  initGarden();
  // 语言切换后重新渲染分页
  document.addEventListener('langApplied', function() {
    renderGarden();
  });
});

// ==================== 构建文章数据 ====================
// 从 Hugo 模板渲染的 DOM 中读取文章数据
function initGarden() {
  const gridEl = document.getElementById('gardenGrid');
  if (!gridEl) return;

  // 从 data 属性读取文章列表（由 Hugo 模板注入）
  const dataEl = document.getElementById('gardenData');
  if (dataEl) {
    try {
      filteredArticles = JSON.parse(dataEl.textContent);
    } catch (e) {
      filteredArticles = [];
    }
  }

  renderGarden();
  bindEvents();
}

// ==================== 渲染文章卡片 ====================
function renderGarden() {
  const gridEl = document.getElementById('gardenGrid');
  const paginationEl = document.getElementById('pagination');
  if (!gridEl) return;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filteredArticles.slice(start, end);

  if (pageItems.length === 0) {
    gridEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary);">暂无文章</div>';
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  let html = '';
  pageItems.forEach(article => {
    const title = loc(article, 'title');
    const desc = loc(article, 'desc');
    const tags = locArray(article, 'tags');
    let imgHtml = '';
    if (SHOW_IMAGES) {
      imgHtml = article.image
        ? `<img src="${article.image}" alt="${title}" loading="lazy" />`
        : `<div class="card-img-placeholder"></div>`;
    }
    const descHtml = SHOW_SUMMARY ? `<p class="card-desc">${desc}</p>` : '';
    html += `
      <a class="garden-card" href="${locPermalink(article)}">
        ${SHOW_IMAGES ? `<div class="card-img">${imgHtml}</div>` : ''}
        <div class="card-body">
          <h3 class="card-title">${title}</h3>
          ${descHtml}
          <div class="card-meta">
            <span class="card-date">${article.date}</span>
            <span class="card-tags">${tags.map(t => '#' + t).join(' ')}</span>
          </div>
        </div>
      </a>
    `;
  });
  gridEl.innerHTML = html;

  // 渲染分页
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  if (paginationEl && totalPages >= 1) {
    const lang = document.documentElement.lang || 'zh';
    const t = (window.i18nMap && window.i18nMap[lang]) || {};
    const prevText = t['prev'] || '‹ 上一页';
    const nextText = t['next'] || '下一页 ›';
    let pHtml = '';
    pHtml += `<button class="page-btn prev-btn" ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}">${prevText}</button>`;
    for (let i = 1; i <= totalPages; i++) {
      pHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    pHtml += `<button class="page-btn next-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">${nextText}</button>`;
    paginationEl.innerHTML = pHtml;
    paginationEl.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (this.disabled) return;
        currentPage = parseInt(this.dataset.page);
        renderGarden();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  } else if (paginationEl) {
    paginationEl.innerHTML = '';
  }
}

// ==================== 事件绑定 ====================
function bindEvents() {
  // 分类筛选
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const category = this.dataset.category;
      filterByCategory(category);
    });
  });

  // 搜索
  const searchInput = document.getElementById('gardenSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      filterBySearch(query);
    });
  }
}

// ==================== 分类筛选 ====================
function filterByCategory(category) {
  const dataEl = document.getElementById('gardenData');
  if (!dataEl) return;
  let allArticles;
  try {
    allArticles = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  if (category === 'all' || !category) {
    filteredArticles = allArticles;
  } else {
    filteredArticles = allArticles.filter(a => loc(a, 'category') === category);
  }
  currentPage = 1;
  renderGarden();
}

// ==================== 搜索筛选 ====================
function filterBySearch(query) {
  const dataEl = document.getElementById('gardenData');
  if (!dataEl) return;
  let allArticles;
  try {
    allArticles = JSON.parse(dataEl.textContent);
  } catch (e) {
    return;
  }

  if (!query) {
    filteredArticles = allArticles;
  } else {
    filteredArticles = allArticles.filter(a =>
      loc(a, 'title').toLowerCase().includes(query) ||
      loc(a, 'desc').toLowerCase().includes(query) ||
      locArray(a, 'tags').some(t => t.toLowerCase().includes(query))
    );
  }
  currentPage = 1;
  renderGarden();
}
