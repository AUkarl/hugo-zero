// ============================================================
// shuo.js - 时刻页离线展示模式
// 说说卡片渲染、无限滚动、每条评论系统
// 支持 waline / twikoo / artalk 评论提供商
// 受 window.momentConfig 控制
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  // ==================== 配置读取 ====================
  var cfg = window.momentConfig || {};
  var commentProvider = cfg.commentProvider || '';
  var commentEnabled = cfg.commentEnabled && commentProvider;
  var batchSize = cfg.paginate || 10;

  // ==================== 状态管理 ====================
  var shuoData = [];
  var renderedCount = 0;

  var dataEl = document.getElementById('shuoData');
  if (dataEl) {
    try {
      shuoData = JSON.parse(dataEl.textContent);
    } catch (e) {
      shuoData = [];
    }
  }

  // ==================== 单条说说 HTML 生成 ====================
  function buildShuoItemHtml(item) {
    var id = item.id;

    var imagesHtml = '';
    if (item.images && item.images.length) {
      var countImg = item.images.length;
      var cls = 'count-' + countImg;
      imagesHtml = '<div class="shuo-images ' + cls + '">';
      item.images.forEach(function(img) {
        imagesHtml += '<img class="shuo-img" src="' + img + '" alt="image" />';
      });
      imagesHtml += '</div>';
    }

    var mediaHtml = '';
    if (item.music) {
      mediaHtml += '<audio class="shuo-audio" controls src="' + item.music + '"></audio>';
    }
    if (item.video) {
      mediaHtml += '<video class="shuo-video" controls src="' + item.video + '"></video>';
    }

    var actionsHtml = '';
    if (commentEnabled) {
      actionsHtml = '<div class="shuo-actions-bar">' +
        '<button class="comment-toggle-btn" data-id="' + id + '">' +
        '<i class="far fa-comment"></i> Comment' +
        '</button></div>';
    }

    var commentHtml = '';
    if (commentEnabled) {
      commentHtml = '<div class="shuo-comment-area" id="comment-area-' + id + '" style="display:none;">' +
        '<div class="comment-container" id="comment-' + id + '"></div>' +
        '</div>';
    }

    return '<div class="shuo-item" data-id="' + id + '">' +
      '<div class="shuo-header">' +
        '<div class="shuo-avatar">' +
          '<img src="' + (item.avatarUrl || '/img/avatar.png') + '" alt="avatar" />' +
        '</div>' +
        '<span class="shuo-name">' + (item.nickname || '博主') + '</span>' +
        '<span class="shuo-time">' + item.time + '</span>' +
      '</div>' +
      '<div class="shuo-content">' + item.text + '</div>' +
      imagesHtml +
      mediaHtml +
      actionsHtml +
      commentHtml +
    '</div>';
  }

  // ==================== 绑定单条事件 ====================
  function bindItemEvents(container) {
    if (!commentEnabled) return;
    container.querySelectorAll('.comment-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = this.dataset.id;
        var area = document.getElementById('comment-area-' + id);
        if (area) {
          var isHidden = area.style.display === 'none';
          area.style.display = isHidden ? 'block' : 'none';
          if (isHidden && !area.dataset.initialized) {
            initComment(id);
            area.dataset.initialized = 'true';
          }
        }
      });
    });
  }

  // ==================== 渲染说说列表（无限滚动） ====================
  function renderShuo() {
    var list = document.getElementById('shuoList');
    if (!list) return;

    if (shuoData.length === 0) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">No moments yet</div>';
      return;
    }

    list.innerHTML = '';
    renderedCount = 0;
    appendBatch();
    setupInfiniteScroll(list);
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
      fragment.appendChild(itemEl);
    }

    list.appendChild(fragment);
    bindItemEvents(list);
    renderedCount = end;

    removeSentinel();
    if (renderedCount < shuoData.length) {
      addSentinel(list);
    }
  }

  // ==================== 无限滚动（IntersectionObserver） ====================
  var scrollObserver = null;

  function setupInfiniteScroll(list) {
    // sentinel is managed by addSentinel/removeSentinel
  }

  function addSentinel(list) {
    var sentinel = document.createElement('div');
    sentinel.className = 'shuo-sentinel';
    sentinel.style.cssText = 'height:1px;width:100%;';
    list.appendChild(sentinel);

    if (!scrollObserver) {
      scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            appendBatch();
          }
        });
      }, { rootMargin: '200px' });
    }
    scrollObserver.observe(sentinel);
  }

  function removeSentinel() {
    if (scrollObserver) {
      scrollObserver.disconnect();
    }
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
    var el = document.getElementById('comment-' + id);
    if (!el) return;
    try {
      twikoo.init({
        envId: envId,
        el: '#comment-' + id,
        region: cfg.twikooRegion || undefined,
        path: '/moments/' + id
      });
    } catch (e) {
      console.warn('Twikoo init failed for moment', id, e);
    }
  }

  function initWaline(id) {
    var serverUrl = cfg.walineServerUrl || '';
    if (!serverUrl) return;
    var el = document.getElementById('comment-' + id);
    if (!el) return;
    import('https://cdn.jsdelivr.net/npm/@waline/client@latest/dist/waline.mjs').then(function(Waline) {
      try {
        Waline.init({
          el: '#comment-' + id,
          serverURL: serverUrl,
          path: '/moments/' + id,
          emoji: cfg.walineEmoji || [],
          locale: document.documentElement.lang || 'zh'
        });
      } catch (e) {
        console.warn('Waline init failed for moment', id, e);
      }
    }).catch(function(e) {
      console.warn('Waline import failed for moment', id, e);
    });
  }

  function initArtalk(id) {
    var server = cfg.artalkServer || '';
    if (!server || typeof Artalk === 'undefined') return;
    var el = document.getElementById('comment-' + id);
    if (!el) return;
    try {
      Artalk.init({
        el: '#comment-' + id,
        pageKey: '/moments/' + id,
        pageTitle: 'Moment ' + id,
        server: server,
        site: cfg.artalkSite || 'default',
        locale: document.documentElement.lang || 'zh'
      });
    } catch (e) {
      console.warn('Artalk init failed for moment', id, e);
    }
  }

  // ==================== 初始渲染 ====================
  renderShuo();
});
