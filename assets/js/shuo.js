// ============================================================
// shuo.js — 时刻页离线展示模式（朋友圈式卡片）
//   · 卡片结构照搬移动端微信朋友圈：左头像 + 右内容列，
//     正文 / 图片九宫格 / 音乐卡片 / 视频 / 链接卡片，
//     底部一条「时间 · 赞 · 评论」，互动区是浅灰底
//   · 点赞：数据存在评论系统里（Waline 计数器 reaction0），
//     同一浏览器记住「已赞」，再点一次取消
//   · 评论：默认显示已有评论，编辑框折叠起来，点「评论」才展开
//   · 受 window.momentConfig 控制（模板注入）
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

  // 朋友圈那种「刚刚 / x 分钟前 / x 小时前 / 昨天 / x 天前」
  function relTime(item) {
    var iso = item.iso;
    var fallback = item.time || '';
    if (!iso) return fallback;
    var then = Date.parse(iso);
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
    try { if (v) localStorage.setItem(likedKey(id), '1'); else localStorage.removeItem(likedKey(id)); } catch (e) { /* 隐私模式下忽略 */ }
  }

  // ==================== 图片 / 音乐 / 视频 / 链接 ====================
  function buildImagesHtml(images) {
    if (!images || !images.length) return '';
    var cls = 'count-' + Math.min(images.length, 9);
    var html = '<div class="shuo-images ' + cls + '">';
    images.forEach(function (img) {
      var src = '', orig = '', srcset = '', sizes = '', dims = '', bg = '';
      if (img && typeof img === 'object') {
        src = img.src || '';
        orig = img.orig || src;
        srcset = img.srcset || '';
        sizes = img.sizes || '33vw';
        if (img.w && img.h) dims = ' width="' + img.w + '" height="' + img.h + '"';
        if (img.lqip) bg = ' style="background-image:url(' + img.lqip + ');background-size:cover;background-position:center"';
      } else if (img) {
        src = String(img);
        orig = src;
      }
      if (!src && !orig) return;
      // 点图看原图（构建时处理过的那张原图优先）
      html += '<a class="shuo-img-link" href="' + esc(orig || src) + '" target="_blank" rel="noopener">';
      if (src) {
        html += '<img class="shuo-img" data-src="' + esc(src) + '" data-srcset="' + esc(srcset) + '" sizes="' + esc(sizes) + '"' + dims + bg + ' alt="image" decoding="async">';
      } else {
        html += '<img class="shuo-img" src="' + esc(orig) + '" alt="image" loading="lazy">';
      }
      html += '</a>';
    });
    return html + '</div>';
  }

  function buildMusicHtml(item, id) {
    var cover = item.musicCover
      ? '<img src="' + esc(item.musicCover) + '" alt="" loading="lazy">'
      : '<i class="fas fa-music" aria-hidden="true"></i>';
    var title = item.musicTitle || '';
    if (!title) {
      // 从链接里猜歌名，但只认「像文件名」的（带扩展名），
      // 像 music.163.com/.../outer/url?id=123 这种接口地址就退回默认文案
      try {
        var last = decodeURIComponent(String(item.music).split('/').pop().split('?')[0]);
        if (/\.[a-z0-9]{2,5}$/i.test(last)) title = last;
      } catch (e) { title = ''; }
    }
    return '<div class="shuo-music" data-id="' + esc(id) + '">' +
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
  function buildShuoItemHtml(item) {
    var id = esc(item.id);

    var likeBtn = likeEnabled
      ? '<button type="button" class="shuo-act shuo-like" data-id="' + id + '">' +
          '<i class="far fa-thumbs-up" aria-hidden="true"></i>' +
          '<span class="shuo-like-label">' + esc(t.like || '赞') + '</span>' +
        '</button>'
      : '';
    var commentBtn = commentEnabled
      ? '<button type="button" class="shuo-act shuo-comment" data-id="' + id + '">' +
          '<i class="far fa-comment-dots" aria-hidden="true"></i>' +
          '<span>' + esc(t.comment || '评论') + '</span>' +
        '</button>'
      : '';

    var interactHtml = '';
    if (likeEnabled || commentEnabled) {
      interactHtml = '<div class="shuo-interact" hidden>' +
        (likeEnabled
          ? '<div class="shuo-likes" hidden><i class="fas fa-thumbs-up" aria-hidden="true"></i>' +
            '<span class="shuo-like-count">0</span><span class="shuo-like-suffix"></span></div>'
          : '') +
        (commentEnabled
          ? '<div class="shuo-comments is-collapsed" id="shuo-comments-' + id + '">' +
              '<div class="comment-container" id="comment-' + id + '"></div>' +
            '</div>'
          : '') +
        '</div>';
    }

    return '<article class="shuo-item" data-id="' + id + '">' +
      '<div class="shuo-avatar"><img src="' + esc(item.avatarUrl || '/img/avatar.png') + '" alt="" loading="lazy"></div>' +
      '<div class="shuo-body">' +
        '<div class="shuo-name">' + esc(item.nickname || '博主') + '</div>' +
        (item.text ? '<div class="shuo-content">' + esc(item.text) + '</div>' : '') +
        buildImagesHtml(item.images) +
        (item.music ? buildMusicHtml(item, item.id) : '') +
        (item.video ? buildVideoHtml(item) : '') +
        (item.link && item.link.url ? buildLinkHtml(item.link) : '') +
        '<div class="shuo-bar">' +
          '<time class="shuo-time"' + (item.iso ? ' datetime="' + esc(item.iso) + '"' : '') + '>' + esc(relTime(item)) + '</time>' +
          '<span class="shuo-bar-actions">' + likeBtn + commentBtn + '</span>' +
        '</div>' +
        interactHtml +
      '</div>' +
    '</article>';
  }

  // ==================== 点赞（Waline 计数器） ====================
  function fetchLike(item, el) {
    if (!likeEnabled) return;
    var url = serverURL + '/api/article?path=' + encodeURIComponent(likePath(item.id)) +
      '&type=' + encodeURIComponent(likeType) + '&lang=' + encodeURIComponent(lang);
    fetch(url, { headers: { accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var d = res && res.data && res.data[0];
        el.__likeCount = d ? Number(d[likeType] || 0) : 0;
        renderLike(item, el);
      })
      .catch(function () { /* 拿不到就只显示按钮，不显示计数 */ });
  }

  function renderLike(item, el) {
    var liked = isLiked(item.id);
    var count = el.__likeCount || 0;

    var btn = el.querySelector('.shuo-like');
    if (btn) {
      btn.classList.toggle('is-liked', liked);
      var label = btn.querySelector('.shuo-like-label');
      if (label) label.textContent = liked ? (t.liked || '已赞') : (t.like || '赞');
      var icon = btn.querySelector('i');
      if (icon) icon.className = (liked ? 'fas' : 'far') + ' fa-thumbs-up';
    }

    var row = el.querySelector('.shuo-likes');
    if (row) {
      row.hidden = count <= 0;
      if (count > 0) {
        var c = row.querySelector('.shuo-like-count');
        if (c) c.textContent = count;
        var suffix = row.querySelector('.shuo-like-suffix');
        if (suffix) suffix.textContent = t.likeCount || '人觉得赞';
      }
    }
    updateInteractVisibility(el);
  }

  function toggleLike(item, el, btn) {
    if (!likeEnabled || btn.dataset.busy === '1') return;
    btn.dataset.busy = '1';

    var liked = isLiked(item.id);
    var before = el.__likeCount || 0;
    // 先本地立即反馈（服务端写入偶尔要几秒，等响应再变会有「点了没反应」的感觉）
    el.__likeCount = Math.max(0, before + (liked ? -1 : 1));
    setLiked(item.id, !liked);
    renderLike(item, el);

    fetch(serverURL + '/api/article?lang=' + encodeURIComponent(lang), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: likePath(item.id), type: likeType, action: liked ? 'desc' : 'inc' })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var d = res && res.data && res.data[0];
        if (d && d[likeType] != null) {          // 用服务端返回的计数校准
          el.__likeCount = Number(d[likeType] || 0);
          renderLike(item, el);
        }
      })
      .catch(function () {                        // 失败就回滚到点击前的样子
        setLiked(item.id, liked);
        el.__likeCount = before;
        renderLike(item, el);
      })
      .then(function () { btn.dataset.busy = '0'; });
  }

  // ==================== 评论 ====================
  function ensureComment(id) {
    if (!commentEnabled || commentInited[id]) return;
    commentInited[id] = true;
    initComment(id);
  }

  function watchComments(id, el) {
    var target = document.getElementById('comment-' + id);
    if (!target || !window.MutationObserver) return;
    var mo = new MutationObserver(function () { updateInteractVisibility(el); });
    mo.observe(target, { childList: true, subtree: true });
  }

  function updateInteractVisibility(el) {
    var box = el.querySelector('.shuo-interact');
    if (!box) return;
    var commentsBox = box.querySelector('.shuo-comments');
    var revealed = commentsBox ? !commentsBox.classList.contains('is-collapsed') : false;
    var hasComments = !!box.querySelector('.wl-cards .wl-card');
    var likeRow = box.querySelector('.shuo-likes');
    var hasLikes = !!likeRow && !likeRow.hidden;
    box.hidden = !(hasComments || hasLikes || revealed);
  }

  function toggleComment(id, el, btn) {
    var box = el.querySelector('.shuo-comments');
    if (!box) return;
    var collapsed = box.classList.contains('is-collapsed');
    if (collapsed) {
      box.classList.remove('is-collapsed');
      ensureComment(id);
      focusEditor(id);
    } else {
      box.classList.add('is-collapsed');
    }
    if (btn) btn.classList.toggle('is-active', collapsed);
    updateInteractVisibility(el);
  }

  function focusEditor(id) {
    var tries = 0;
    (function attempt() {
      var box = document.getElementById('comment-' + id);
      var editor = box && box.querySelector('.wl-editor');
      if (editor) {
        try { editor.focus(); } catch (e) { /* 忽略 */ }
        var interact = box.closest('.shuo-interact');
        if (interact) {
          var top = interact.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
        return;
      }
      if (tries++ < 20) setTimeout(attempt, 150);
    })();
  }

  // ==================== 事件绑定 ====================
  function bindItemEvents(root) {
    root.querySelectorAll('.shuo-like').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var el = btn.closest('.shuo-item');
        var item = byId[btn.dataset.id];
        if (el && item) toggleLike(item, el, btn);
      });
    });

    root.querySelectorAll('.shuo-comment').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var el = btn.closest('.shuo-item');
        if (el) toggleComment(btn.dataset.id, el, btn);
      });
    });

    // 音乐卡片：一个播放时暂停其他
    root.querySelectorAll('.shuo-music').forEach(function (box) {
      var audio = box.querySelector('audio');
      var btn = box.querySelector('.shuo-music-play');
      if (!audio || !btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (audio.paused) {
          document.querySelectorAll('.shuo-music audio').forEach(function (a) { if (a !== audio) a.pause(); });
          var p = audio.play();
          if (p && p.catch) p.catch(function () { /* 自动播放被拦，交给用户再点一次 */ });
        } else {
          audio.pause();
        }
      });
      audio.addEventListener('play', function () {
        box.classList.add('is-playing');
        btn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
      });
      audio.addEventListener('pause', function () {
        box.classList.remove('is-playing');
        btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      });
      audio.addEventListener('ended', function () {
        box.classList.remove('is-playing');
        btn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
      });
    });
  }

  // ==================== 进入视口才拉数据（省请求） ====================
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
    var item = byId[el.dataset.id];
    if (!item) return;
    if (likeEnabled) fetchLike(item, el);
    if (commentEnabled) {
      // 评论列表默认就要能看到，所以这里就初始化；编辑框由 CSS 折叠
      ensureComment(item.id);
      watchComments(item.id, el);
    }
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

    for (var i = renderedCount; i < end; i++) {
      temp.innerHTML = buildShuoItemHtml(shuoData[i]);
      var itemEl = temp.firstElementChild;
      if (itemEl) {
        fragment.appendChild(itemEl);
        observeCard(itemEl);
      }
    }

    list.appendChild(fragment);
    bindItemEvents(list);
    // 图片进入视口前 200px 再加载高清（先显示 LQIP 占位）
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
      console.warn('Waline import failed for moment', id, e);
    });
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
    // 详情页（模板里已经是静态卡片）：只需要绑事件 + 图片懒加载
    bindItemEvents(document);
    if (window.Motion) window.Motion.lazyImages(document);
  }
});
