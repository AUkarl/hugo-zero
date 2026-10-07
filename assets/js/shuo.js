// ============================================================
// shuo.js — 时刻页离线展示模式（朋友圈式卡片）
//   · 卡片结构照搬移动端微信朋友圈：左头像 + 右内容列
//   · 正文里的短代码（音频/视频/网易云/B站…）会像文章页一样渲染出来
//   · 底栏「时间 · 赞 N · 评论 N」：点赞数走评论系统的计数器（Waline reaction0），
//     评论数走评论系统的评论计数接口
//   · 评论列表只有「真的有评论」时才显示；编辑框默认折叠，点「评论」才展开
//   · 内容可以是文本/图片/音乐/视频/链接的任意一个或任意组合
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ==================== 配置 ====================
  var cfg = window.momentConfig || {};
  var t = cfg.i18n || {};
  var commentProvider = cfg.commentProvider || '';
  var commentEnabled = !!(cfg.commentEnabled && commentProvider);
  var likeEnabled = !!cfg.likeEnabled && !!cfg.walineServerUrl;
  var likeType = cfg.likeType || 'reaction0';
  var serverURL = String(cfg.walineServerUrl || '').replace(/\/+$/, '');
  var batchSize = cfg.paginate || 10;
  var lang = cfg.lang || document.documentElement.lang || 'zh';

  // ==================== 状态 ====================
  var shuoData = [];
  var byId = {};
  var renderedCount = 0;
  var commentInited = {};

  var dataEl = document.getElementById('shuoData');
  if (dataEl) {
    try { shuoData = JSON.parse(dataEl.textContent) || []; } catch (e) { shuoData = []; }
  }
  shuoData.forEach(function (it) { if (it && it.id != null) byId[it.id] = it; });

  // ==================== 小工具 ====================
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function relTime(item) {
    var fallback = item.time || '';
    if (!item.iso) return fallback;
    var then = Date.parse(item.iso);
    if (isNaN(then)) return fallback;
    var diff = Date.now() - then;
    if (diff < 0) diff = 0;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return t.justNow || '刚刚';
    if (mins < 60) return mins + ' ' + (t.minutesAgo || '分钟前');
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + ' ' + (t.hoursAgo || '小时前');
    if (hours < 48) return t.yesterday || '昨天';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' ' + (t.daysAgo || '天前');
    return fallback;
  }

  function likePath(id) { return '/moments/' + id; }
  function likedKey(id) { return 'shuo-liked:' + likePath(id); }
  function isLiked(id) { try { return localStorage.getItem(likedKey(id)) === '1'; } catch (e) { return false; } }
  function setLiked(id, v) {
    try { if (v) localStorage.setItem(likedKey(id), '1'); else localStorage.removeItem(likedKey(id)); } catch (e) { /* 忽略 */ }
  }

  /* 正文拆分：短代码渲染出来的媒体块单独拿出来，其余当纯文本（朋友圈那种）。
     注意：像网易云音乐这种短代码，除了占位 div 还会输出一段内联 <script> 把占位换成 iframe；
     用 innerHTML 搬动节点时脚本不会执行，所以这里把脚本也收集起来，插入后再跑一次。 */
  var MEDIA_SEL = 'audio, video, iframe, .audio-player, .video-player, .video-embed, .shortcode-embed, .gallery, figure';
  function splitContent(rawHtml, fallbackText) {
    if (!rawHtml) return { text: fallbackText || '', media: [], scripts: [] };
    var box = document.createElement('div');
    box.innerHTML = rawHtml;
    var media = [];
    var scripts = [];
    var textParts = [];
    Array.prototype.slice.call(box.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
        scripts.push(node.textContent || '');
        return;
      }
      // 注意要判断「节点自己」也算媒体：网易云的占位 div 本身就是 .video-embed，
      // 里面并没有 iframe/audio 之类的子孙，只看子孙会把它当正文文本丢掉
      if (node.nodeType === 1 && ((node.matches && node.matches(MEDIA_SEL)) || (node.querySelector && node.querySelector(MEDIA_SEL)))) {
        media.push(node);
        return;
      }
      var txt = (node.textContent || '').replace(/\u00a0/g, ' ').trim();
      if (txt) textParts.push(txt);
    });
    return { text: textParts.join('\n') || (fallbackText || ''), media: media, scripts: scripts };
  }

  /* innerHTML 搬过来的 <script> 不会自动执行，这里重建再执行。
     必须在卡片已经插入文档之后执行：游离节点里插脚本不会跑，
     而且网易云那种脚本是全局查找占位节点的，游离时也找不到。 */
  function runScripts(host, codes) {
    var target = (host && host.isConnected) ? host : document.body;
    codes.forEach(function (code) {
      if (!code.trim()) return;
      var s = document.createElement('script');
      s.textContent = code;
      target.appendChild(s);
      s.remove();
    });
  }

  // ==================== 图片 ====================
  function buildImagesHtml(item) {
    var images = item.images || [];
    if (!images.length) return '';
    var count = Math.min(images.length, 9);
    var html = '<div class="shuo-images count-' + count + '">';
    images.forEach(function (img) {
      var src = '', orig = '', srcset = '', sizes = '', dims = '', bg = '', ratio = '';
      if (img && typeof img === 'object') {
        src = img.src || '';
        orig = img.orig || src;
        srcset = img.srcset || '';
        sizes = img.sizes || '';
        if (img.w && img.h) { dims = ' width="' + img.w + '" height="' + img.h + '"'; ratio = img.w + ' / ' + img.h; }
        if (img.lqip) bg = ' style="background-image:url(' + img.lqip + ');background-size:cover;background-position:center"';
      } else if (img) {
        src = String(img);
        orig = src;
      }
      if (!src && !orig) return;
      // 单图：按原图比例先占好位置（比例拿不到就用 no-ratio 兜底，避免塌成一条细线）
      var linkStyle = (count === 1 && ratio) ? ' style="aspect-ratio:' + ratio + '"' : '';
      var linkCls = 'shuo-img-link' + (count === 1 && !ratio ? ' no-ratio' : '');
      // 外层用按钮：点了只放大查看，不跳转外链
      html += '<button type="button" class="' + linkCls + '" aria-label="' + esc(t.view || '查看大图') + '"' + linkStyle + '>';
      if (src) {
        html += '<img class="shuo-img" data-src="' + esc(src) + '" data-srcset="' + esc(srcset) + '" sizes="' + esc(sizes) + '"' + dims + bg + ' alt="" decoding="async">';
      } else {
        html += '<img class="shuo-img" src="' + esc(orig) + '" alt="" loading="lazy">';
      }
      html += '</button>';
    });
    return html + '</div>';
  }

  // ==================== 音乐 / 视频 / 链接 ====================
  function buildMusicHtml(item) {
    var cover = item.musicCover
      ? '<img src="' + esc(item.musicCover) + '" alt="" loading="lazy">'
      : '<i class="fas fa-music" aria-hidden="true"></i>';
    var title = item.musicTitle || '';
    if (!title) {
      try {
        var last = decodeURIComponent(String(item.music).split('/').pop().split('?')[0]);
        if (/\.[a-z0-9]{2,5}$/i.test(last)) title = last;
      } catch (e) { title = ''; }
    }
    return '<div class="shuo-music">' +
      '<span class="shuo-music-cover">' + cover + '</span>' +
      '<span class="shuo-music-info"><span class="shuo-music-title">' + esc(title || '音乐') + '</span></span>' +
      '<button type="button" class="shuo-music-play" aria-label="播放"><i class="fas fa-play" aria-hidden="true"></i></button>' +
      '<audio preload="none" src="' + esc(item.music) + '"></audio>' +
      '</div>';
  }

  function buildVideoHtml(item) {
    return '<div class="shuo-video-wrap">' +
      '<video class="shuo-video" controls preload="metadata"' +
      (item.videoPoster ? ' poster="' + esc(item.videoPoster) + '"' : '') +
      ' src="' + esc(item.video) + '"></video></div>';
  }

  function buildLinkHtml(link) {
    var host = '';
    try { host = new URL(link.url, location.origin).hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
    var thumb = link.image ? '<span class="shuo-link-thumb"><img src="' + esc(link.image) + '" alt="" loading="lazy"></span>' : '';
    return '<a class="shuo-link" href="' + esc(link.url) + '" target="_blank" rel="noopener">' +
      '<span class="shuo-link-main">' +
        '<span class="shuo-link-title">' + esc(link.title || link.url) + '</span>' +
        (link.desc ? '<span class="shuo-link-desc">' + esc(link.desc) + '</span>' : '') +
        (host ? '<span class="shuo-link-host">' + esc(host) + '</span>' : '') +
      '</span>' + thumb +
      '</a>';
  }

  // ==================== 单条卡片 ====================
  function actButton(kind, id, icon, label) {
    return '<button type="button" class="shuo-act shuo-' + kind + '" data-id="' + esc(id) + '">' +
      '<i class="' + icon + '" aria-hidden="true"></i>' +
      '<span class="shuo-act-label">' + esc(label) + '</span>' +
      '<span class="shuo-act-count" hidden>0</span>' +
      '</button>';
  }

  function buildShuoItemHtml(item) {
    var id = esc(item.id);
    var likeBtn = likeEnabled ? actButton('like', item.id, 'far fa-thumbs-up', t.like || '赞') : '';
    var commentBtn = commentEnabled ? actButton('comment', item.id, 'far fa-comment-dots', t.comment || '评论') : '';
    var commentsHtml = commentEnabled
      ? '<div class="shuo-comments is-collapsed" id="shuo-comments-' + id + '" hidden>' +
          '<div class="comment-container" id="comment-' + id + '"></div>' +
        '</div>'
      : '';

    return '<article class="shuo-item" data-id="' + id + '">' +
      '<div class="shuo-avatar"><img src="' + esc(item.avatarUrl || '/img/avatar.webp') + '" alt="" loading="lazy"></div>' +
      '<div class="shuo-body">' +
        '<div class="shuo-name">' + esc(item.nickname || '博主') + '</div>' +
        '<div class="shuo-content" hidden></div>' +
        buildImagesHtml(item) +
        '<div class="shuo-media" hidden></div>' +
        (item.music ? buildMusicHtml(item) : '') +
        (item.video ? buildVideoHtml(item) : '') +
        (item.link && item.link.url ? buildLinkHtml(item.link) : '') +
        '<div class="shuo-bar">' +
          '<time class="shuo-time"' + (item.iso ? ' datetime="' + esc(item.iso) + '"' : '') + '>' + esc(relTime(item)) + '</time>' +
          '<span class="shuo-bar-actions">' + likeBtn + commentBtn + '</span>' +
        '</div>' +
        commentsHtml +
      '</div>' +
    '</article>';
  }

  /* 把正文（纯文本 + 短代码媒体）填进卡片；返回正文里带的脚本，交给插入文档后再执行 */
  function fillContent(el, item) {
    var parts = splitContent(item.contentHtml, item.text);
    var textEl = el.querySelector('.shuo-content');
    if (textEl && parts.text) {
      textEl.textContent = parts.text;
      textEl.hidden = false;
    }
    var mediaEl = el.querySelector('.shuo-media');
    if (mediaEl && parts.media.length) {
      parts.media.forEach(function (node) { mediaEl.appendChild(node); });
      mediaEl.hidden = false;
    }
    return parts.scripts;
  }

  /* 详情页（模板已经渲染好 HTML）：同样把媒体块拆出来 */
  function fillContentFromTemplate(el) {
    var raw = el.querySelector('template.shuo-raw');
    if (!raw) return;
    var parts = splitContent(raw.innerHTML, '');
    var textEl = el.querySelector('.shuo-content');
    if (textEl && parts.text) { textEl.textContent = parts.text; textEl.hidden = false; }
    var mediaEl = el.querySelector('.shuo-media');
    if (mediaEl && parts.media.length) {
      parts.media.forEach(function (node) { mediaEl.appendChild(node); });
      mediaEl.hidden = false;
    }
    if (mediaEl && parts.scripts.length) runScripts(mediaEl, parts.scripts);
    raw.remove();
  }

  // ==================== 计数（点赞 + 评论） ====================
  function renderCount(el, kind, count) {
    var btn = el.querySelector('.shuo-' + kind);
    if (!btn) return;
    var label = btn.querySelector('.shuo-act-label');
    var num = btn.querySelector('.shuo-act-count');
    if (!num) return;
    if (count > 0) {
      num.textContent = count;
      num.hidden = false;
      if (label) label.hidden = true;
    } else {
      num.hidden = true;
      if (label) label.hidden = false;
    }
  }

  function renderLike(el) {
    var id = el.dataset.id;
    var liked = isLiked(id);
    var btn = el.querySelector('.shuo-like');
    if (btn) {
      btn.classList.toggle('is-liked', liked);
      var icon = btn.querySelector('i');
      if (icon) icon.className = (liked ? 'fas' : 'far') + ' fa-thumbs-up';
    }
    renderCount(el, 'like', el.__likeCount || 0);
  }

  function renderComment(el) {
    renderCount(el, 'comment', el.__commentCount || 0);
    updateCommentsVisibility(el);
  }

  function updateCommentsVisibility(el) {
    var box = el.querySelector('.shuo-comments');
    if (!box) return;
    var revealed = box.dataset.revealed === '1';
    // 有没有评论：以计数接口为准，DOM 里出现评论条目也算（兼容 Waline 各版本的类名）
    var hasComments = (el.__commentCount || 0) > 0 || !!box.querySelector('.wl-cards .wl-card-item, .wl-cards .wl-card');
    box.hidden = !(hasComments || revealed);
  }

  function apiGet(url) {
    return fetch(url, { headers: { accept: 'application/json' } }).then(function (r) { return r.json(); });
  }

  function fetchLike(el) {
    if (!likeEnabled) return;
    apiGet(serverURL + '/api/article?path=' + encodeURIComponent(likePath(el.dataset.id)) +
      '&type=' + encodeURIComponent(likeType) + '&lang=' + encodeURIComponent(lang))
      .then(function (res) {
        var d = res && res.data && res.data[0];
        el.__likeCount = d ? Number(d[likeType] || 0) : 0;
        renderLike(el);
      })
      .catch(function () { /* 拿不到就只显示按钮 */ });
  }

  function fetchCommentCount(el) {
    if (!commentEnabled) return;
    apiGet(serverURL + '/api/comment?type=count&url=' + encodeURIComponent(likePath(el.dataset.id)) + '&lang=' + encodeURIComponent(lang))
      .then(function (res) {
        var n = res && res.data ? Number(res.data[0] || 0) : 0;
        el.__commentCount = n;
        renderComment(el);
        // 有评论才去初始化评论列表；没有就不打扰评论系统（点「评论」时才初始化编辑框）
        if (n > 0) ensureComment(el, false);
      })
      .catch(function () { /* 忽略 */ });
  }

  function toggleLike(el, btn) {
    if (!likeEnabled || btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';

    var id = el.dataset.id;
    var liked = isLiked(id);
    var before = el.__likeCount || 0;
    el.__likeCount = Math.max(0, before + (liked ? -1 : 1));
    setLiked(id, !liked);
    renderLike(el);

    fetch(serverURL + '/api/article?lang=' + encodeURIComponent(lang), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: likePath(id), type: likeType, action: liked ? 'desc' : 'inc' })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var d = res && res.data && res.data[0];
        if (d && d[likeType] != null) { el.__likeCount = Number(d[likeType] || 0); renderLike(el); }
      })
      .catch(function () { el.__likeCount = before; setLiked(id, liked); renderLike(el); })
      .then(function () { btn.dataset.busy = '0'; });
  }

  // ==================== 评论 ====================
  function ensureComment(el, reveal) {
    var id = el.dataset.id;
    if (!commentEnabled) return;
    if (commentInited[id]) { if (reveal) revealEditor(el); return; }
    commentInited[id] = true;

    // 加载态：点开后立刻有反馈，不让用户以为点了没反应
    if (reveal) {
      var box = el.querySelector('.shuo-comments');
      if (box && !box.querySelector('.shuo-comments-loading')) {
        var tip = document.createElement('p');
        tip.className = 'shuo-comments-loading';
        tip.textContent = t.loading || '评论加载中…';
        box.appendChild(tip);
      }
    }

    initComment(id);
    watchComments(el);

    if (reveal) {
      var tries = 0;
      (function wait() {
        var box = el.querySelector('.shuo-comments');
        var editor = box && box.querySelector('.wl-editor');
        if (editor) { revealEditor(el); return; }
        // 已经确定加载失败就不要再等了（错误提示会留在那里）
        if (box && box.querySelector('.shuo-comments-loading.is-error')) return;
        if (tries++ < 60) setTimeout(wait, 150);   // 最多等 9 秒（CDN 慢也能等到）
      })();
    }
  }

  function revealEditor(el) {
    var box = el.querySelector('.shuo-comments');
    if (!box) return;
    // 初始化是异步的：等它好的这段时间里用户可能已经点了别的时刻，
    // 那就不要再把这个旧的编辑框弹出来（否则又会同时出现两个）
    if (activeEditorEl !== el) return;
    var tip = box.querySelector('.shuo-comments-loading');
    if (tip) tip.remove();
    box.dataset.revealed = '1';
    box.hidden = false;
    var editor = box.querySelector('.wl-editor');
    if (editor) {
      try { editor.focus(); } catch (e) { /* 忽略 */ }
      var target = box.querySelector('.wl-panel') || box;
      var top = target.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  /* 同时只允许一个评论编辑框：打开新的之前把其余的都收起来 */
  var activeEditorEl = null;

  function closeEditor(el) {
    var box = el.querySelector('.shuo-comments');
    if (!box) return;
    box.dataset.revealed = '0';
    box.classList.add('is-collapsed');
    var tip = box.querySelector('.shuo-comments-loading');
    if (tip) tip.remove();
    var btn = el.querySelector('.shuo-comment');
    if (btn) btn.classList.remove('is-active');
    if (activeEditorEl === el) activeEditorEl = null;
    updateCommentsVisibility(el);
  }

  function closeOtherEditors(except) {
    Array.prototype.slice.call(document.querySelectorAll('.shuo-item')).forEach(function (el) {
      if (el === except) return;
      var box = el.querySelector('.shuo-comments');
      if (box && box.dataset.revealed === '1') closeEditor(el);
    });
  }

  function toggleComment(el, btn) {
    var box = el.querySelector('.shuo-comments');
    if (!box) return;
    if (box.dataset.revealed === '1') {
      closeEditor(el);
      return;
    }
    closeOtherEditors(el);          // 旧的自动关掉，只留最新点的这个
    activeEditorEl = el;
    box.classList.remove('is-collapsed');
    btn.classList.add('is-active');
    ensureComment(el, true);
    updateCommentsVisibility(el);
  }

  function watchComments(el) {
    var target = el.querySelector('.comment-container');
    if (!target || !window.MutationObserver) return;
    var timer = null;
    var mo = new MutationObserver(function () {
      updateCommentsVisibility(el);
      clearTimeout(timer);
      timer = setTimeout(function () {
        apiGet(serverURL + '/api/comment?type=count&url=' + encodeURIComponent(likePath(el.dataset.id)) + '&lang=' + encodeURIComponent(lang))
          .then(function (res) { el.__commentCount = res && res.data ? Number(res.data[0] || 0) : el.__commentCount; renderComment(el); })
          .catch(function () { /* 忽略 */ });
      }, 1200);
    });
    mo.observe(target, { childList: true, subtree: true });
  }

  // ==================== 事件绑定 ====================
  function bindItemEvents(root) {
    root.querySelectorAll('.shuo-like').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var el = btn.closest('.shuo-item');
        if (el) toggleLike(el, btn);
      });
    });

    root.querySelectorAll('.shuo-comment').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var el = btn.closest('.shuo-item');
        if (el) toggleComment(el, btn);
      });
    });

    root.querySelectorAll('.shuo-music').forEach(function (box) {
      if (box.dataset.bound) return;
      box.dataset.bound = '1';
      var audio = box.querySelector('audio');
      var btn = box.querySelector('.shuo-music-play');
      if (!audio || !btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (audio.paused) {
          document.querySelectorAll('.shuo-music audio').forEach(function (a) { if (a !== audio) a.pause(); });
          var p = audio.play();
          if (p && p.catch) p.catch(function () { /* 浏览器拦住自动播放就等用户再点 */ });
        } else {
          audio.pause();
        }
      });
      audio.addEventListener('play', function () { box.classList.add('is-playing'); btn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>'; });
      audio.addEventListener('pause', function () { box.classList.remove('is-playing'); btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>'; });
      audio.addEventListener('ended', function () { box.classList.remove('is-playing'); btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>'; });
    });
  }

  // ==================== 进入视口才拉数据 ====================
  var cardObserver = null;
  function observeCard(el) {
    if (!('IntersectionObserver' in window)) { activateCard(el); return; }
    if (!cardObserver) {
      cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            cardObserver.unobserve(entry.target);
            activateCard(entry.target);
          }
        });
      }, { rootMargin: '300px' });
    }
    cardObserver.observe(el);
  }

  function activateCard(el) {
    if (likeEnabled) fetchLike(el);
    if (commentEnabled) fetchCommentCount(el);
  }

  // ==================== 列表渲染（无限滚动） ====================
  function renderShuo() {
    var list = document.getElementById('shuoList');
    if (!list) return;
    if (!shuoData.length) {
      list.innerHTML = '<div class="shuo-empty">' + esc(t.noMoments || '还没有发布时刻') + '</div>';
      return;
    }
    list.innerHTML = '';
    renderedCount = 0;
    appendBatch();
  }

  function appendBatch() {
    var list = document.getElementById('shuoList');
    if (!list || renderedCount >= shuoData.length) return;

    var end = Math.min(renderedCount + batchSize, shuoData.length);
    var fragment = document.createDocumentFragment();
    var temp = document.createElement('div');
    var pending = [];        // 等卡片进文档后再跑的短代码脚本

    for (var i = renderedCount; i < end; i++) {
      temp.innerHTML = buildShuoItemHtml(shuoData[i]);
      var itemEl = temp.firstElementChild;
      if (!itemEl) continue;
      var scripts = fillContent(itemEl, shuoData[i]);
      if (scripts && scripts.length) pending.push({ el: itemEl, scripts: scripts });
      fragment.appendChild(itemEl);
      observeCard(itemEl);
    }

    list.appendChild(fragment);
    pending.forEach(function (p) { runScripts(p.el.querySelector('.shuo-media') || p.el, p.scripts); });
    bindItemEvents(list);
    if (window.Motion) window.Motion.lazyImages(list);
    renderedCount = end;

    removeSentinel();
    if (renderedCount < shuoData.length) addSentinel(list);
  }

  var scrollObserver = null;

  function addSentinel(list) {
    var sentinel = document.createElement('div');
    sentinel.className = 'shuo-sentinel';
    sentinel.style.cssText = 'height:1px;width:100%;';
    list.appendChild(sentinel);

    if (!scrollObserver) {
      scrollObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) appendBatch(); });
      }, { rootMargin: '200px' });
    }
    scrollObserver.observe(sentinel);
  }

  function removeSentinel() {
    if (scrollObserver) scrollObserver.disconnect();
    var old = document.querySelector('.shuo-sentinel');
    if (old) old.remove();
  }

  // ==================== 评论系统初始化（多提供商） ====================
  function initComment(id) {
    switch (commentProvider) {
      case 'twikoo': initTwikoo(id); break;
      case 'waline': initWaline(id); break;
      case 'artalk': initArtalk(id); break;
    }
  }

  function initTwikoo(id) {
    var envId = cfg.twikooEnvId || '';
    if (!envId || typeof twikoo === 'undefined') return;
    if (!document.getElementById('comment-' + id)) return;
    try {
      twikoo.init({ envId: envId, el: '#comment-' + id, region: cfg.twikooRegion || undefined, path: '/moments/' + id });
    } catch (e) {
      console.warn('Twikoo init failed for moment', id, e);
    }
  }

  function initWaline(id) {
    if (!serverURL || !document.getElementById('comment-' + id)) return;
    // waline.js 走 CDN，偶尔会慢或失败：重试几次，实在不行给出提示，别让用户一直等
    var tries = 0;
    (function load() {
      import('https://cdn.jsdelivr.net/npm/@waline/client@latest/dist/waline.js').then(function (Waline) {
        try {
          Waline.init({
            el: '#comment-' + id,
            serverURL: serverURL,
            path: '/moments/' + id,
            emoji: cfg.walineEmoji || [],
            lang: lang
          });
        } catch (e) {
          console.warn('Waline init failed for moment', id, e);
        }
      }).catch(function (e) {
        if (tries++ < 2) { setTimeout(load, 1200); return; }
        console.warn('Waline import failed for moment', id, e);
        showCommentError(id);
      });
    })();
  }

  /* 评论系统加载失败时，把加载提示换成可读的错误提示 */
  function showCommentError(id) {
    var box = document.getElementById('shuo-comments-' + id);
    if (!box) return;
    var tip = box.querySelector('.shuo-comments-loading');
    if (!tip) {
      tip = document.createElement('p');
      tip.className = 'shuo-comments-loading';
      box.appendChild(tip);
    }
    tip.classList.add('is-error');
    tip.textContent = t.loadError || '评论加载失败，请刷新页面重试';
  }

  function initArtalk(id) {
    var server = cfg.artalkServer || '';
    if (!server || typeof Artalk === 'undefined' || !document.getElementById('comment-' + id)) return;
    try {
      Artalk.init({
        el: '#comment-' + id,
        pageKey: '/moments/' + id,
        pageTitle: 'Moment ' + id,
        server: server,
        site: cfg.artalkSite || 'default',
        locale: lang
      });
    } catch (e) {
      console.warn('Artalk init failed for moment', id, e);
    }
  }

  // ==================== 初始渲染 ====================
  if (document.getElementById('shuoList')) {
    renderShuo();
  } else {
    // 详情页：模板已渲染好结构，这里只处理正文媒体 + 绑事件 + 图片懒加载
    Array.prototype.slice.call(document.querySelectorAll('.shuo-item')).forEach(function (el) {
      fillContentFromTemplate(el);
    });
    bindItemEvents(document);
    if (window.Motion) window.Motion.lazyImages(document);
  }
});
