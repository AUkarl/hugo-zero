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
  // 服务端（header.html）已经按当前页面写好 active / aria-current，
  // 这里只做补充：万一某页没匹配上，再按路径最后一段补一次。
  // 注意别再删服务端给的结果——之前那样做会把 /work/ 这类页面的高亮清掉，
  // 新的导航下划线（.nav-underline）就找不到"当前项"了。
  function highlightNav() {
    const segments = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    const current = segments.length ? segments[segments.length - 1] : '';
    document.querySelectorAll('.nav-link:not(.blog-link)').forEach(link => {
      if (link.classList.contains('active')) return;
      const href = (link.getAttribute('href') || '').replace(/\/+$/, '');
      const tail = href.split('/').filter(Boolean).pop() || '';
      if (current && tail && tail === current) link.classList.add('active');
    });
  }
  highlightNav();

  // ==================== 导航活跃下划线（桌面端滑动） ====================
  // 一根共用的下划线：当前页默认停在 active 项下面，鼠标移到别的项时滑过去，
  // 移开后滑回来。移动端抽屉里不显示（CSS 里隐藏）。
  (function navUnderline() {
    const container = document.querySelector('.nav-links');
    const links = Array.from(document.querySelectorAll('.nav-link:not(.blog-link)'));
    if (!container || links.length < 2) return;

    const bar = document.createElement('span');
    bar.className = 'nav-underline';
    bar.setAttribute('aria-hidden', 'true');
    container.appendChild(bar);

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const activeLink = () => document.querySelector('.nav-link.active:not(.blog-link)') || null;

    function place(link, animate) {
      if (!link) { bar.style.opacity = '0'; return; }
      const c = container.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      if (!r.width) { bar.style.opacity = '0'; return; }
      if (!animate) bar.style.transition = 'none';
      bar.style.opacity = '1';
      bar.style.width = r.width + 'px';
      bar.style.transform = 'translate3d(' + (r.left - c.left) + 'px,0,0)';
      if (!animate) {
        void bar.offsetWidth;                     // 强制回流，让下面的过渡重新生效
        bar.style.transition = '';
      }
    }

    // 首次定位不要有动画（避免页面一打开下划线从左边滑过来）
    requestAnimationFrame(() => place(activeLink(), false));

    links.forEach(link => {
      link.addEventListener('mouseenter', () => place(link, !reduceMotion));
      link.addEventListener('focus', () => place(link, !reduceMotion));
    });
    container.addEventListener('mouseleave', () => place(activeLink(), !reduceMotion));
    container.addEventListener('focusout', (e) => {
      if (!container.contains(e.relatedTarget)) place(activeLink(), !reduceMotion);
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => place(activeLink(), false), 120);
    });
    // 语言切换会改导航文字宽度，重新定位
    document.addEventListener('langApplied', () => requestAnimationFrame(() => place(activeLink(), false)));
    // 网络字体/图标加载完成后文字宽度会变，也要重新对一次（否则下划线会偏）
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => place(activeLink(), false));
    }
    window.addEventListener('load', () => place(activeLink(), false));
  })();

  // ==================== 抽屉菜单 ====================
  // 移动端侧滑导航，768px 断点以下生效
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');
  const navClose = document.querySelector('.nav-close');

  if (navToggle && navLinksContainer && navOverlay) {
    // 同步 aria-expanded，让读屏用户知道抽屉是否展开
    function setDrawerAria(open) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function openDrawer() {
      navLinksContainer.classList.add('open');
      navOverlay.classList.add('show');
      document.body.style.overflow = 'hidden';
      setDrawerAria(true);
    }

    function closeDrawer() {
      navLinksContainer.classList.remove('open');
      navOverlay.classList.remove('show');
      document.body.style.overflow = '';
      setDrawerAria(false);
    }

    // Esc 关闭抽屉（键盘用户）
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navLinksContainer.classList.contains('open')) {
        closeDrawer();
        navToggle.focus();
      }
    });

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
  // 优先从 URL 路径检测语言（404 页面始终用默认语言渲染，需靠 URL 判断）
  function detectPageLang() {
    const path = window.location.pathname;
    if (path.startsWith('/en/') || path === '/en') return 'en';
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

});
