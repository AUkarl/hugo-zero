// ============================================================
// email.js - 邮件页功能：登录/注册，对接 SkyMail API
// 登录: POST /api/login → {code, message, data: {token}}
// 注册: POST /api/user/add → {code, message, data}
// Token 存入 localStorage.mailToken，请求头 Authorization 直接使用（不加 Bearer）
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  let mailTab = 'login';
  let currentLang = localStorage.getItem('lang') || 'zh';

  // ==================== 配置读取 ====================
  const emailCfg = window.emailConfig || {};
  const apiCfg = emailCfg.api || {};
  const mailDomain = emailCfg.mailDomain || 'mail.molx.net';
  const mailUrl = mailDomain.startsWith('http') ? mailDomain : 'https://' + mailDomain;

  // ==================== API 请求辅助 ====================
  async function apiRequest(method, endpoint, body, useToken) {
    const url = (apiCfg.baseUrl || '') + endpoint;
    const headers = { 'Content-Type': 'application/json' };
    if (useToken) {
      const token = localStorage.getItem('mailToken');
      if (token) headers['Authorization'] = token;
    }
    const opts = { method, headers };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const resp = await fetch(url, opts);
    const data = await resp.json().catch(() => ({}));
    const successCode = apiCfg.successCode || 200;
    return { ok: data.code === successCode, data, status: resp.status };
  }

  function getRedirectUrl() {
    if (apiCfg.redirectUrl) return apiCfg.redirectUrl;
    return mailUrl;
  }

  function redirectToMail() {
    setTimeout(() => { window.location.href = getRedirectUrl(); }, 1500);
  }

  // ==================== 语言文本辅助 ====================
  function t(key, fallbackZh, fallbackEn) {
    if (window.i18nMap && window.i18nMap[currentLang] && window.i18nMap[currentLang][key]) {
      return window.i18nMap[currentLang][key];
    }
    return currentLang === 'zh' ? fallbackZh : fallbackEn;
  }

  // ==================== 渲染表单 ====================
  function renderMailForm() {
    const content = document.getElementById('mailFormContent');
    const submitBtn = document.getElementById('mailSubmitBtn');
    if (!content || !submitBtn) return;

    if (mailTab === 'login') {
      content.innerHTML = `
        <div class="form-group">
          <label for="mailLoginEmail" data-i18n="email-label-email">${t('email-label-email', '邮箱地址', 'Email')}</label>
          <input type="email" id="mailLoginEmail" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label for="mailLoginPassword" data-i18n="email-label-password">${t('email-label-password', '密码', 'Password')}</label>
          <input type="password" id="mailLoginPassword" placeholder="......" required />
        </div>
      `;
      submitBtn.textContent = currentLang === 'zh' ? '登 陆' : 'Login';
    } else {
      content.innerHTML = `
        <div class="form-group">
          <label for="mailRegEmail" data-i18n="email-label-email">${t('email-label-email', '邮箱地址', 'Email')}</label>
          <input type="email" id="mailRegEmail" placeholder="your@email.com" required />
        </div>
        <div class="form-group">
          <label for="mailRegPassword" data-i18n="email-label-password">${t('email-label-password', '密码', 'Password')}</label>
          <input type="password" id="mailRegPassword" placeholder="......" required />
        </div>
        <div class="form-group">
          <label for="mailRegConfirm" data-i18n="email-label-confirm">${t('email-label-confirm', '确认密码', 'Confirm')}</label>
          <input type="password" id="mailRegConfirm" placeholder="......" required />
        </div>
        <div class="form-group">
          <label for="mailRegCode" data-i18n="email-label-regcode">${t('email-label-regcode', '注册码', 'Registration Code')}</label>
          <input type="text" id="mailRegCode" placeholder="......" required />
        </div>
      `;
      submitBtn.textContent = currentLang === 'zh' ? '注 册' : 'Register';
    }
  }

  // ==================== Tab 切换 ====================
  document.querySelectorAll('.mail-tabs button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mail-tabs button').forEach(b => b.classList.remove('active-tab'));
      this.classList.add('active-tab');
      mailTab = this.dataset.tab;
      renderMailForm();
    });
  });

  // ==================== 显示错误/成功 ====================
  function showError(msg) {
    const errorEl = document.getElementById('mailError');
    const successEl = document.getElementById('mailSuccess');
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
    if (successEl) successEl.style.display = 'none';
  }

  function showSuccess(msg) {
    const errorEl = document.getElementById('mailError');
    const successEl = document.getElementById('mailSuccess');
    if (successEl) { successEl.textContent = msg; successEl.style.display = 'block'; }
    if (errorEl) errorEl.style.display = 'none';
  }

  function clearMessages() {
    const errorEl = document.getElementById('mailError');
    const successEl = document.getElementById('mailSuccess');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';
  }

  // ==================== 表单提交 ====================
  const mailForm = document.getElementById('mailForm');
  if (mailForm) {
    mailForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearMessages();

      if (mailTab === 'login') {
        // ---- 登录 ----
        const email = document.getElementById('mailLoginEmail').value.trim();
        const pass = document.getElementById('mailLoginPassword').value.trim();
        if (!email || !pass) {
          showError(t('email-err-fill', '请填写完整信息', 'Please fill in all fields'));
          return;
        }

        if (!apiCfg.enabled) {
          showSuccess(t('email-login-ok', '登录成功！正在跳转至邮箱...', 'Login successful! Redirecting...'));
          redirectToMail();
          return;
        }

        try {
          const result = await apiRequest('POST', apiCfg.loginEndpoint || '/api/login', { email, password: pass }, false);
          if (result.ok && result.data.data && result.data.data.token) {
            localStorage.setItem('mailToken', result.data.data.token);
            showSuccess(t('email-login-ok', '登录成功！正在跳转至邮箱...', 'Login successful! Redirecting...'));
            redirectToMail();
          } else {
            const msg = result.data.message || '';
            showError(msg || t('email-err-login', '账号或密码错误', 'Invalid email or password'));
          }
        } catch (err) {
          showError(t('email-err-network', '网络错误，请稍后重试', 'Network error, please try again'));
        }

      } else {
        // ---- 注册 ----
        const email = document.getElementById('mailRegEmail').value.trim();
        const pass = document.getElementById('mailRegPassword').value.trim();
        const confirm = document.getElementById('mailRegConfirm').value.trim();
        const regCode = document.getElementById('mailRegCode').value.trim();
        if (!email || !pass || !confirm || !regCode) {
          showError(t('email-err-fill', '请填写完整信息', 'Please fill in all fields'));
          return;
        }
        if (pass !== confirm) {
          showError(t('email-err-pwmatch', '两次密码输入不一致', 'Passwords do not match'));
          return;
        }
        if (pass.length < 6) {
          showError(t('email-err-pwlen', '密码长度至少6位', 'Password must be at least 6 characters'));
          return;
        }

        if (!apiCfg.enabled) {
          showSuccess(t('email-reg-ok', '注册成功！正在跳转到登录...', 'Registration successful! Redirecting to login...'));
          setTimeout(() => { document.querySelector('.mail-tabs button[data-tab="login"]').click(); }, 2000);
          return;
        }

        try {
          const result = await apiRequest('POST', apiCfg.registerEndpoint || '/api/user/add', { email, password: pass, regCode }, false);
          if (result.ok) {
            showSuccess(t('email-reg-ok', '注册成功！正在跳转到登录...', 'Registration successful! Redirecting to login...'));
            setTimeout(() => { document.querySelector('.mail-tabs button[data-tab="login"]').click(); }, 2000);
          } else {
            const msg = result.data.message || '';
            showError(msg || t('email-err-reg', '注册失败，请稍后重试', 'Registration failed, please try again'));
          }
        } catch (err) {
          showError(t('email-err-network', '网络错误，请稍后重试', 'Network error, please try again'));
        }
      }
    });
  }

  // ==================== 监听语言切换 ====================
  document.addEventListener('langChange', function(e) {
    currentLang = e.detail.lang;
    renderMailForm();
  });

  // ==================== 初始渲染 ====================
  renderMailForm();

  // ==================== 第三方登录按钮 ====================
  document.querySelectorAll('.third-party-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const provider = this.dataset.provider;
      const errorEl = document.getElementById('mailError');
      if (errorEl) errorEl.style.display = 'none';
      if (provider === 'github') {
        window.location.href = 'https://github.com/login/oauth/authorize';
      } else if (provider === 'google') {
        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth';
      }
    });
  });

  console.log('email.js loaded - SkyMail API integration');
});
