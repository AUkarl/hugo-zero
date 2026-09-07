// ============================================================
// article.js - 文章页功能：目录生成、字数统计、评论、赞赏
// 适用于 Hugo 主题，文章内容直接由模板渲染，无需动态加载
// ============================================================

// ==================== 翻译辅助 ====================
function t(key) {
  const lang = document.documentElement.lang || 'zh';
  return (window.i18nMap && window.i18nMap[lang] && window.i18nMap[lang][key]) || key;
}

function applyArticleI18n() {
  const lang = document.documentElement.lang || 'zh';
  const map = (window.i18nMap && window.i18nMap[lang]) || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (map[key] !== undefined) {
      if (key === 'article-author-bio' || key === 'donate-desc') {
        el.innerHTML = map[key];
      } else {
        el.textContent = map[key];
      }
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (map[key] !== undefined) {
      el.placeholder = map[key];
    }
  });
}

document.addEventListener('langApplied', applyArticleI18n);

// ==================== 生成目录 ====================
// 从文章正文的 h2/h3 标签自动生成目录，支持滚动高亮
(function generateTOC() {
  const body = document.getElementById('articleBody');
  const tocNav = document.getElementById('tocNav');
  if (!body || !tocNav) return;

  const headings = body.querySelectorAll('h2, h3');
  if (headings.length === 0) {
    tocNav.innerHTML = '<p style="font-size:0.8rem;color:var(--text-secondary);">' + t('article-no-toc') + '</p>';
    return;
  }

  let tocHtml = '<ul>';
  let currentLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent.trim();
    if (!heading.id) {
      heading.id = 'section-' + index;
    }
    const id = heading.id;

    if (currentLevel === 0) {
      tocHtml += `<li class="level-${level}"><a href="#${id}" data-target="${id}">${text}</a>`;
      currentLevel = level;
    } else if (level === 2) {
      if (currentLevel === 3) {
        tocHtml += '</li></ul>';
      } else {
        tocHtml += '</li>';
      }
      tocHtml += `<li class="level-${level}"><a href="#${id}" data-target="${id}">${text}</a>`;
      currentLevel = 2;
    } else if (level === 3) {
      if (currentLevel === 2) {
        tocHtml += `<ul><li class="level-${level}"><a href="#${id}" data-target="${id}">${text}</a>`;
      } else {
        tocHtml += `</li><li class="level-${level}"><a href="#${id}" data-target="${id}">${text}</a>`;
      }
      currentLevel = 3;
    }
  });
  if (currentLevel === 3) {
    tocHtml += '</li></ul>';
  }
  tocHtml += '</li></ul>';

  tocNav.innerHTML = tocHtml;

  // 滚动时高亮当前目录项
  const tocLinks = tocNav.querySelectorAll('a');
  const allHeadings = body.querySelectorAll('h2, h3');

  function updateActiveLink() {
    let currentId = '';
    allHeadings.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100) {
        currentId = section.id;
      }
    });
    tocLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  }

  window.addEventListener('scroll', updateActiveLink);
  window.addEventListener('resize', updateActiveLink);
  updateActiveLink();
})();

// ==================== 字数与阅读时间 ====================
// 统计文章正文字数，按 250 字/分钟计算阅读时间
(function calcWordCount() {
  const body = document.getElementById('articleBody');
  if (!body) return;
  const text = body.textContent || body.innerText || '';
  const words = text.replace(/\s+/g, '').length;
  const readTime = Math.max(1, Math.round(words / 250));

  const wordSpan = document.getElementById('wordCount');
  const timeSpan = document.getElementById('readTime');
  if (wordSpan) wordSpan.textContent = words;
  if (timeSpan) timeSpan.textContent = readTime;
})();

// ==================== 评论功能 ====================
// 本地评论（无后端），支持提交和显示
document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submitComment');
  if (submitBtn) {
    submitBtn.addEventListener('click', function() {
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if (!text) {
        alert(t('article-comment-required'));
        return;
      }
      const list = document.getElementById('commentList');
      const now = new Date();
      const timeStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
      const item = document.createElement('div');
      item.className = 'comment-item';
      item.innerHTML = `
        <span class="comment-author">Guest</span>
        <span class="comment-time">${timeStr}</span>
        <div class="comment-text">${text}</div>
      `;
      list.prepend(item);
      input.value = '';
    });
  }
});

// ==================== 赞赏弹窗 ====================
// 点击赞赏按钮弹出二维码，点击关闭或遮罩层关闭
document.addEventListener('DOMContentLoaded', function() {
  const donateBtn = document.getElementById('donateBtn');
  const donateModal = document.getElementById('donateModal');
  const donateClose = document.getElementById('donateClose');

  if (donateBtn && donateModal && donateClose) {
    donateBtn.addEventListener('click', function() {
      donateModal.classList.add('show');
    });
    donateClose.addEventListener('click', function() {
      donateModal.classList.remove('show');
    });
    donateModal.addEventListener('click', function(e) {
      if (e.target === donateModal) {
        donateModal.classList.remove('show');
      }
    });
  }
});

// ==================== 应用翻译 ====================
applyArticleI18n();

