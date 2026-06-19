// === UI Dashboard — métricas vindas do backend (/dashboard/summary) ===

const UIDashboard = {
  /**
   * @param {HTMLElement} container
   * @param {object|null} summary - resposta de /dashboard/summary; se ausente,
   *   calcula a partir dos itens carregados (fallback offline).
   */
  render(container, summary) {
    const data = summary || this._fromItems(AppState.items);
    container.innerHTML = `
      <div class="dashboard">
        <div class="metric-card">
          <span class="metric-label">Total de itens</span>
          <span class="metric-value metric-value--default">${data.total_items}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Críticos</span>
          <span class="metric-value metric-value--red">${data.critical_count}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Alta urgência</span>
          <span class="metric-value metric-value--orange">${data.high_urgency_count}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Pendentes</span>
          <span class="metric-value metric-value--blue">${data.pending_count}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Em andamento</span>
          <span class="metric-value metric-value--blue">${data.in_progress_count}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Concluídos</span>
          <span class="metric-value metric-value--green">${data.completed_count}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Arquivados</span>
          <span class="metric-value metric-value--default">${data.archived_count}</span>
        </div>
      </div>
    `;
  },

  _fromItems(items) {
    const counts = Model.getDashboardCounts(items);
    return {
      total_items: counts.total,
      critical_count: counts.critical,
      high_urgency_count: counts.high,
      pending_count: counts.pending,
      in_progress_count: counts.inProgress,
      completed_count: counts.completed,
      archived_count: items.filter((i) => i.archivedAt).length,
    };
  },
};
