// === Storage — cliente da API REST com JWT e backup JSON ===

const Storage = {
  async _request(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...Auth.authHeader(),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      Auth.logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200) || 'Resposta inválida do servidor.');
      }
    }

    if (!res.ok) {
      let message = `Erro ${res.status} ao comunicar com o servidor.`;
      if (data) {
        if (typeof data.detail === 'string') message = data.detail;
        else if (Array.isArray(data.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
        else if (data.error) message = data.error;
      }
      throw new Error(message);
    }

    return data;
  },

  async adminUnlock(password) {
    return this._request('/admin/unlock', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async adminListUsers() {
    return this._request('/admin/users');
  },

  async adminApproveUser(userId) {
    return this._request(`/admin/users/${userId}/approve`, { method: 'POST' });
  },

  async adminRejectUser(userId) {
    return this._request(`/admin/users/${userId}/reject`, { method: 'POST' });
  },

  async adminUpdateUser(userId, payload) {
    return this._request(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteUser(userId) {
    await this._request(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  async updateSettings(payload) {
    return this._request('/auth/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async listMyProjects() {
    return this._request('/projects/mine');
  },

  async selectProject(projectId) {
    return this.updateSettings({ active_project_id: projectId });
  },

  async adminListProjects() {
    return this._request('/admin/projects');
  },

  async adminCreateProject(name) {
    return this._request('/admin/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async adminUpdateProject(projectId, name) {
    return this._request(`/admin/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async adminDeleteProject(projectId) {
    await this._request(`/admin/projects/${projectId}`, { method: 'DELETE' });
  },

  async load() {
    const data = await this._request('/tickets');
    return {
      version: CONFIG.STORAGE_VERSION,
      items: (data.items || []).map((item) => Model.normalizeItem(item)),
    };
  },

  async createItem(payload) {
    const data = await this._request('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return Model.normalizeItem(data.item);
  },

  async updateItem(id, payload) {
    const data = await this._request(`/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return Model.normalizeItem(data.item);
  },

  async deleteItem(id) {
    await this._request(`/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async updateStatus(id, status) {
    const data = await this._request(`/tickets/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return Model.normalizeItem(data.item);
  },

  async archiveItem(id) {
    const data = await this._request(`/tickets/${encodeURIComponent(id)}/archive`, {
      method: 'PATCH',
    });
    return Model.normalizeItem(data.item);
  },

  async reopenItem(id) {
    const data = await this._request(`/tickets/${encodeURIComponent(id)}/reopen`, {
      method: 'PATCH',
    });
    return Model.normalizeItem(data.item);
  },

  async dashboardSummary() {
    return this._request('/dashboard/summary');
  },

  async importItems(items) {
    const data = await this._request('/import/json', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    return (data.items || []).map((item) => Model.normalizeItem(item));
  },

  exportJSON(items) {
    const payload = {
      version: CONFIG.STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      app: CONFIG.APP_NAME,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `change-tracker-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  parseImportFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || !Array.isArray(data.items)) {
            reject(new Error('Arquivo inválido: esperado objeto com array "items".'));
            return;
          }
          resolve(data.items);
        } catch {
          reject(new Error('Não foi possível ler o arquivo JSON.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsText(file);
    });
  },
};
