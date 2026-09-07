(function () {
  'use strict';

  var toolsI18n = {
    'zh': {
      '视频工具': '视频工具', '音频工具': '音频工具', '图片工具': '图片工具',
      '代码工具': '代码工具', '网络工具': '网络工具', '格式工具': '格式工具',
      '文档工具': '文档工具', '资源嗅探': '资源嗅探', '编码工具': '编码工具',
      '开发者工具': '开发者工具',
      '格式转换': '格式转换', '视频裁剪': '视频裁剪', '视频压缩': '视频压缩', '提取音频': '提取音频',
      '音频转换': '音频转换', '音频剪辑': '音频剪辑', '音量调节': '音量调节', '提取人声': '提取人声',
      '图片压缩': '图片压缩', '裁剪缩放': '裁剪缩放', '调色滤镜': '调色滤镜',
      '代码格式化': '代码格式化', 'JSON解析': 'JSON解析', '正则测试': '正则测试', '加密解密': '加密解密',
      'IP查询': 'IP查询', 'DNS检测': 'DNS检测', '端口扫描': '端口扫描', '网站测速': '网站测速',
      '日期格式化': '日期格式化', '进制转换': '进制转换', '颜色转换': '颜色转换', 'URL编解码': 'URL编解码',
      'Markdown预览': 'Markdown预览', '文本对比': '文本对比', '字数统计': '字数统计', '拼写检查': '拼写检查',
      '页面资源提取': '页面资源提取', '链接分析': '链接分析', '媒体下载': '媒体下载',
      'Base64编解码': 'Base64编解码', '哈希生成': '哈希生成', 'JWT解析': 'JWT解析', 'AES加密': 'AES加密',
      '时间戳转换': '时间戳转换', 'JSON校验': 'JSON校验', '正则可视化': '正则可视化', 'API测试': 'API测试',
      'tool-convert': '转换', 'tool-converting': '模拟转换中...', 'tool-demo': '（演示功能）',
      'tool-query': '查询', 'tool-querying': '模拟查询中...', 'tool-input-host': '输入域名或IP',
      'tool-preview': '预览', 'tool-previewing': '模拟预览',
      'tool-developing': '此工具正在开发中，敬请期待。', 'tool-learn': '了解详情', 'tool-in-dev': '工具开发中'
    },
    'en': {
      '视频工具': 'Video', '音频工具': 'Audio', '图片工具': 'Image',
      '代码工具': 'Code', '网络工具': 'Network', '格式工具': 'Format',
      '文档工具': 'Document', '资源嗅探': 'Resource Sniffer', '编码工具': 'Encoding',
      '开发者工具': 'Developer',
      '格式转换': 'Convert Format', '视频裁剪': 'Video Trim', '视频压缩': 'Video Compress', '提取音频': 'Extract Audio',
      '音频转换': 'Audio Convert', '音频剪辑': 'Audio Clip', '音量调节': 'Volume Adjust', '提取人声': 'Extract Vocals',
      '图片压缩': 'Image Compress', '裁剪缩放': 'Crop & Resize', '调色滤镜': 'Filters',
      '代码格式化': 'Code Format', 'JSON解析': 'JSON Parse', '正则测试': 'Regex Test', '加密解密': 'Encrypt/Decrypt',
      'IP查询': 'IP Lookup', 'DNS检测': 'DNS Check', '端口扫描': 'Port Scan', '网站测速': 'Speed Test',
      '日期格式化': 'Date Format', '进制转换': 'Base Convert', '颜色转换': 'Color Convert', 'URL编解码': 'URL Encode/Decode',
      'Markdown预览': 'Markdown Preview', '文本对比': 'Text Diff', '字数统计': 'Word Count', '拼写检查': 'Spell Check',
      '页面资源提取': 'Page Resources', '链接分析': 'Link Analysis', '媒体下载': 'Media Download',
      'Base64编解码': 'Base64 Decode', '哈希生成': 'Hash Generate', 'JWT解析': 'JWT Parse', 'AES加密': 'AES Encrypt',
      '时间戳转换': 'Timestamp Convert', 'JSON校验': 'JSON Validate', '正则可视化': 'Regex Visualize', 'API测试': 'API Test',
      'tool-convert': 'Convert', 'tool-converting': 'Converting...', 'tool-demo': '(Demo)',
      'tool-query': 'Lookup', 'tool-querying': 'Looking up...', 'tool-input-host': 'Enter domain or IP',
      'tool-preview': 'Preview', 'tool-previewing': 'Previewing',
      'tool-developing': 'This tool is under development, stay tuned.', 'tool-learn': 'Learn More', 'tool-in-dev': 'In Development'
    }
  };

  function t(key) {
    var lang = document.documentElement.lang || 'zh';
    return (toolsI18n[lang] && toolsI18n[lang][key]) || key;
  }

  function renderTools() {
    var container = document.getElementById('toolsContainer');
    if (!container || !window.toolsData) return;
    container.innerHTML = '';
    window.toolsData.forEach(function (cat) {
      var catName = t(cat.category);
      var catDiv = document.createElement('div');
      catDiv.className = 'tool-category';
      var subHtml = cat.subItems.map(function (sub) {
        return '<span class="tool-sub-item" data-category="' + cat.category + '" data-sub="' + sub + '">' + t(sub) + '</span>';
      }).join('');
      catDiv.innerHTML = '<div class="cat-title"><span class="emoji">' + cat.emoji + '</span> ' + catName + '</div><div class="tool-sub-items">' + subHtml + '</div>';
      container.appendChild(catDiv);
    });
    bindToolEvents();
  }

  function bindToolEvents() {
    document.querySelectorAll('.tool-sub-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var category = this.dataset.category;
        var sub = this.dataset.sub;
        document.querySelectorAll('.tool-sub-item').forEach(function (el) { el.classList.remove('active-tool'); });
        this.classList.add('active-tool');
        var toolDisplay = document.getElementById('toolDisplay');
        var toolDisplayName = document.getElementById('toolDisplayName');
        var toolInterface = document.getElementById('toolInterface');
        toolDisplay.classList.add('show');
        toolDisplayName.textContent = t(category) + ' · ' + t(sub);
        var html = '';
        if (sub === '格式转换' || sub === '音频转换' || sub === '图片压缩' || sub === '代码格式化') {
          html = '<input type="file" /><button onclick="alert(\'' + t('tool-converting') + '\')">' + t('tool-convert') + '</button><span class="hint">' + t('tool-demo') + '</span>';
        } else if (sub === 'IP查询') {
          html = '<input type="text" placeholder="' + t('tool-input-host') + '" value="example.com" /><button onclick="alert(\'' + t('tool-querying') + '\')">' + t('tool-query') + '</button><span class="hint">' + t('tool-demo') + '</span>';
        } else if (sub === 'Markdown预览') {
          html = '<textarea rows="3" style="width:100%;font-family:inherit;"># Title\n**Bold** *Italic*</textarea><button onclick="alert(\'' + t('tool-previewing') + '\')">' + t('tool-preview') + '</button>';
        } else {
          html = '<span class="hint">' + t('tool-developing') + '</span><button onclick="alert(\'' + t('tool-in-dev') + '\')">' + t('tool-learn') + '</button>';
        }
        toolInterface.innerHTML = html;
      });
    });
  }

  renderTools();
  document.addEventListener('langApplied', renderTools);
})();
