// ============================================================
// common.js - 全局功能：主题切换、语言切换、导航、滚动按钮
// 适用于 Hugo 主题，保留所有原有交互逻辑
// ============================================================

// 导航默认翻译（会被各页面 i18nMap 合并）
const I18N_NAV_DEFAULTS = {
  'zh': {
    'nav-home': '主页', 'nav-tools': '工具', 'nav-blog': '博客', 'nav-work': '工坊',
    'nav-email': '邮件', 'nav-archive': '归档', 'nav-moments': '时刻', 'nav-about': '关于',
    'article-license': '本站文章如无特别声明，遵循CC BY-NC-SA 4.0协议。'
  },
  'en': {
    'nav-home': 'Home', 'nav-tools': 'Tools', 'nav-blog': 'Blog', 'nav-work': 'Studio',
    'nav-email': 'Mail', 'nav-archive': 'Archive', 'nav-moments': 'Moments', 'nav-about': 'About',
    'article-license': 'Licensed under CC BY-NC-SA 4.0 unless otherwise noted.'
  }
};

// 保存 header.html 注入的 nav-site-name（页面脚本可能覆盖 window.i18nMap）
const _savedNavSiteName = {
  zh: window.i18nMap && window.i18nMap.zh ? window.i18nMap.zh['nav-site-name'] : undefined,
  en: window.i18nMap && window.i18nMap.en ? window.i18nMap.en['nav-site-name'] : undefined
};

document.addEventListener('DOMContentLoaded', function() {

  // ==================== 导航高亮 ====================
  // 根据当前页面路径自动高亮对应导航项
  function highlightNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'Home.html';
    const navLinks = document.querySelectorAll('.nav-link:not(.blog-link)');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  highlightNav();

  // ==================== 抽屉菜单 ====================
  // 移动端侧滑导航，768px 断点以下生效
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const navClose = document.querySelector('.nav-close');

  if (navToggle && navLinksContainer && navOverlay) {
    function openDrawer() {
      navLinksContainer.classList.add('open');
      navOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      navLinksContainer.classList.remove('open');
      navOverlay.classList.remove('show');
      document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if (navLinksContainer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    navOverlay.addEventListener('click', closeDrawer);
    if (navClose) {
      navClose.addEventListener('click', closeDrawer);
    }

    // 点击导航链接关闭抽屉（不阻止跳转）
    document.querySelectorAll('#navLinks .nav-link, #navLinks .blog-link').forEach(link => {
      link.addEventListener('click', function() {
        closeDrawer();
      });
    });

    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        closeDrawer();
      }
    });
  }

  // ==================== 主题切换 ====================
  // 三态循环：auto → light → dark → auto
  const themes = ['auto', 'light', 'dark'];
  const themeToggle = document.getElementById('themeToggle');

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = themeToggle ? themeToggle.querySelector('i') : null;
    if (icon) {
      if (theme === 'light') icon.className = 'fas fa-sun';
      else if (theme === 'dark') icon.className = 'fas fa-moon';
      else icon.className = 'fas fa-adjust';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const current = localStorage.getItem('theme') || 'auto';
      let idx = themes.indexOf(current);
      idx = (idx + 1) % themes.length;
      setTheme(themes[idx]);
    });
  }

  const savedTheme = localStorage.getItem('theme') || 'auto';
  setTheme(savedTheme);

  // ==================== 语言切换 ====================
  // 支持 zh/en 双语切换，通过 data-i18n 属性应用翻译
  const langToggle = document.getElementById('langToggle');
  // 从 html lang 属性检测语言（由 Hugo 构建时设定）
  function detectPageLang() {
    const htmlLang = (document.documentElement.lang || '').toLowerCase();
    if (htmlLang.startsWith('en')) return 'en';
    return 'zh';
  }
  let currentLang = detectPageLang();

  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
    if (!window.i18nMap) window.i18nMap = {};
    if (!window.i18nMap[lang]) window.i18nMap[lang] = {};
    window.i18nMap[lang] = Object.assign({}, I18N_NAV_DEFAULTS[lang], window.i18nMap[lang]);
    if (_savedNavSiteName[lang]) {
      window.i18nMap[lang]['nav-site-name'] = _savedNavSiteName[lang];
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (window.i18nMap[lang] && window.i18nMap[lang][key] !== undefined) {
        if (key === 'about-bio') {
          el.innerHTML = window.i18nMap[lang][key];
        } else {
          el.textContent = window.i18nMap[lang][key];
        }
      }
    });
    // 通知其他组件语言已切换
    document.dispatchEvent(new CustomEvent('langApplied', { detail: { lang: lang } }));
  }

  if (langToggle) {
    langToggle.addEventListener('click', function() {
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      // 优先使用模板注入的翻译页 URL
      if (window.translatedPageUrl) {
        window.location.href = window.translatedPageUrl;
        return;
      }
      // 兜底：通过 URL 前缀切换
      const path = window.location.pathname;
      let targetPath;
      if (newLang === 'en') {
        targetPath = path.startsWith('/en/') ? path : '/en' + path;
      } else {
        targetPath = path.replace(/^\/en/, '') || '/';
      }
      window.location.href = targetPath;
    });
  }

  applyLanguage(currentLang);

  // ==================== 滚动按钮 ====================
  // 回到顶部 / 到底部按钮，根据滚动位置自动显隐
  const topBtn = document.getElementById('scrollToTop');
  const bottomBtn = document.getElementById('scrollToBottom');

  function updateScrollButtons() {
    if (!topBtn || !bottomBtn) return;
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const atTop = scrollY < 30;
    const atBottom = scrollY + winHeight >= docHeight - 30;

    topBtn.classList.toggle('hidden', atTop);
    bottomBtn.classList.toggle('hidden', atBottom);
  }

  if (topBtn && bottomBtn) {
    window.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);
    updateScrollButtons();

    topBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    bottomBtn.addEventListener('click', function() {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    });
  }

  console.log('common.js loaded - moonlight-minimal theme');
});
