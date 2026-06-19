// === Admin Page — bootstrap da página /admin ===

(function initAdminPage() {
  if (!document.getElementById('admin-gate')) return;

  const start = () => UIAdmin.initPage();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
