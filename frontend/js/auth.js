// === Auth — token JWT (localStorage) e telas de login/cadastro ===

const Auth = {
  TOKEN_KEY: 'ct_token',
  USER_KEY: 'ct_user',
  ADMIN_UNLOCK_KEY: 'ct_admin_unlocked',
  APP_URL: '/',
  LOGIN_URL: '/login',
  REGISTER_URL: '/register',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  getUser() {
    try {
      const raw = sessionStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(this.USER_KEY);
    }
  },

  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.ADMIN_UNLOCK_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user?.role === 'admin' && user?.status === 'active';
  },

  isAdminUnlocked() {
    return sessionStorage.getItem(this.ADMIN_UNLOCK_KEY) === '1';
  },

  setAdminUnlocked(value) {
    if (value) {
      sessionStorage.setItem(this.ADMIN_UNLOCK_KEY, '1');
    } else {
      sessionStorage.removeItem(this.ADMIN_UNLOCK_KEY);
    }
  },

  authHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  withToken(url) {
    const token = this.getToken();
    if (!token || !url) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  },

  redirectToLogin() {
    window.location.href = this.LOGIN_URL;
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }
    return true;
  },

  logout() {
    this.clear();
    this.redirectToLogin();
  },

  async fetchMe() {
    const res = await fetch('/auth/me', { headers: this.authHeader() });
    if (res.status === 401) {
      this.logout();
      throw new Error('Sessão expirada.');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.detail) || 'Não foi possível carregar o perfil.');
    }
    this.setUser(data);
    return data;
  },

  applyHeaderBranding(user) {
    const projectEl = document.getElementById('header-project');
    const project = (user?.project_name || '').trim();
    if (projectEl) {
      projectEl.textContent = project ? `: ${project}` : '';
    }
    document.title = project ? `Change Tracker: ${project}` : 'Change Tracker';
    this.updateAdminLockButton(user);
  },

  updateAdminLockButton(user) {
    const lockBtn = document.getElementById('btn-admin-lock');
    if (!lockBtn) return;

    const show = user?.role === 'admin' && user?.status === 'active';
    lockBtn.hidden = !show;
    lockBtn.style.display = show ? '' : 'none';
    lockBtn.setAttribute('aria-hidden', show ? 'false' : 'true');
    lockBtn.tabIndex = show ? 0 : -1;
  },
};

function parseApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  return fallback;
}

(function initAuthPages() {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');

  if (Auth.isAuthenticated() && (loginForm || registerForm)) {
    window.location.href = Auth.APP_URL;
    return;
  }

  if (loginForm) {
    initLoginForm(loginForm);
  }

  if (registerForm) {
    initRegisterForm(registerForm);
  }
})();

function initLoginForm(form) {
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit');
  const passwordInput = document.getElementById('auth-password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const email = document.getElementById('auth-email').value.trim();
    const password = passwordInput.value;

    if (password.length < 6) {
      errorEl.textContent = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    submitBtn.disabled = true;
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Não foi possível entrar. Tente novamente.'));
      }

      Auth.setToken(data.access_token);
      window.location.href = Auth.APP_URL;
    } catch (err) {
      errorEl.textContent = err.message || 'Erro de conexão com o servidor.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initRegisterForm(form) {
  const errorEl = document.getElementById('auth-error');
  const successEl = document.getElementById('auth-success');
  const submitBtn = document.getElementById('auth-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    if (successEl) successEl.textContent = '';

    const name = document.getElementById('auth-name').value.trim();
    const emailInput = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    if (name.length < 2) {
      errorEl.textContent = 'Informe seu nome.';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    const email = emailInput.endsWith('@ct.com') ? emailInput : `${emailInput}@ct.com`;

    submitBtn.disabled = true;
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(parseApiError(data, 'Não foi possível enviar a solicitação.'));
      }

      form.reset();
      if (successEl) {
        successEl.textContent =
          data.message || 'Cadastro enviado. Aguarde a aprovação do administrador.';
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Erro de conexão com o servidor.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
