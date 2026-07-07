/*
  Notification Center — 7 Days Creation
  State management, dynamic time parsing, tab filtering, and search logic
*/

(function () {
  'use strict';

  // Auth Guard
  if (typeof API !== 'undefined') API.requireAuth();

  // =============================================
  // DEFAULT NOTIFICATION LOGS
  // =============================================
  const defaultNotifications = [
    { id: 1, type: "Inquiries", icon: "fa-user-plus", title: "New Web Inquiry Received", desc: "Rajesh Mehta submitted an inquiry for project '7 Days Heights'.", time: new Date(Date.now() - 1000 * 60 * 25).toISOString(), read: false }, // 25 mins ago
    { id: 2, type: "Campaigns", icon: "fa-envelope", title: "Email Campaign Blasted", desc: "Campaign 'Weekly Project Digest' successfully sent to 4,285 subscribers via Resend API.", time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: true }, // 3 hours ago
    { id: 3, type: "System", icon: "fa-key", title: "Resend API Key Connected", desc: "Resend email credentials validated successfully.", time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true }, // 1 day ago
    { id: 4, type: "Inquiries", icon: "fa-user-plus", title: "New Walking Inquiry Logged", desc: "Sales representative logged Sneha Patel for 'Creation Residency'.", time: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), read: false }, // 28 hours ago
    { id: 5, type: "Campaigns", icon: "fa-comments", title: "WhatsApp Campaign Dispatched", desc: "WhatsApp blast 'Signature Towers VIP Launch' successfully sent to 842 contacts.", time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), read: true } // 2 days ago
  ];

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const notifListEl = document.getElementById('notificationsList');
  const emptyStateEl = document.getElementById('emptyState');

  // Metrics
  const countAllEl = document.getElementById('countAll');
  const countUnreadEl = document.getElementById('countUnread');
  const countInquiriesEl = document.getElementById('countInquiries');
  const countCampaignsEl = document.getElementById('countCampaigns');

  // Filters
  const tabButtons = document.querySelectorAll('.filter-tab');
  const searchInput = document.getElementById('notifSearch');

  // Page Actions
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let notifications = [];
  let activeFilter = 'all';

  // =============================================
  // TOAST SYSTEM
  // =============================================
  function showToast(message) {
    if (!toastMessage) return;
    toastMessage.textContent = message;
    toastMessage.className = 'save-toast active';
    setTimeout(() => {
      toastMessage.className = 'save-toast';
    }, 3000);
  }

  // =============================================
  // DATA CONTROLLERS
  // =============================================
  async function loadData() {
    try {
      if (typeof API !== 'undefined' && API.session.isLoggedIn()) {
        const res = await API.notifications.list();
        if (res && res.ok && res.data.data) {
          notifications = res.data.data.map(n => ({
            id: n.id,
            type: n.type,
            icon: n.icon,
            title: n.title,
            desc: n.description,
            time: n.created_at,
            read: n.is_read === 1
          }));
          updateMetrics();
          renderNotifications();
          updateGlobalBellBadge();
          return;
        }
      }
    } catch (err) {
      console.warn('[Notifications] API unavailable, using localStorage:', err);
    }

    // Fallback: localStorage
    const data = localStorage.getItem('notifications');
    if (!data) {
      localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
      notifications = [...defaultNotifications];
    } else {
      notifications = JSON.parse(data);
    }
    updateMetrics();
    renderNotifications();
    updateGlobalBellBadge();
  }

  function saveData() {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateMetrics();
    renderNotifications();
    updateGlobalBellBadge();
  }

  // =============================================
  // SYNC UNREAD BELL BADGE
  // =============================================
  function updateGlobalBellBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const bellBadges = document.querySelectorAll('.notif-badge');
    bellBadges.forEach(badge => {
      if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    });
  }

  // =============================================
  // METRICS UPDATER
  // =============================================
  function updateMetrics() {
    if (!countAllEl) return;
    countAllEl.textContent = notifications.length;
    countUnreadEl.textContent = notifications.filter(n => !n.read).length;
    countInquiriesEl.textContent = notifications.filter(n => n.type === 'Inquiries').length;
    countCampaignsEl.textContent = notifications.filter(n => n.type === 'Campaigns').length;
  }

  // =============================================
  // TIME DIFFERENCE HELPER
  // =============================================
  function formatRelativeTime(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Yesterday, ${timeStr}`;
    }
    if (diffDays < 7) return `${diffDays} days ago`;

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString([], options);
  }

  // =============================================
  // RENDER LOGS
  // =============================================
  function renderNotifications() {
    if (!notifListEl) return;

    const query = searchInput.value.toLowerCase().trim();

    const filtered = notifications.filter(item => {
      // 1. Tab filter
      if (activeFilter !== 'all' && item.type !== activeFilter) {
        return false;
      }

      // 2. Search query filter
      if (query) {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.desc.toLowerCase().includes(query);
        if (!titleMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });

    notifListEl.innerHTML = '';

    if (filtered.length === 0) {
      emptyStateEl.style.display = 'flex';
      return;
    } else {
      emptyStateEl.style.display = 'none';
    }

    filtered.forEach(item => {
      const div = document.createElement('div');
      div.className = `notif-item type-${item.type.toLowerCase()} ${item.read ? 'read' : 'unread'}`;
      div.setAttribute('data-id', item.id);

      // Determine badge class
      let badgeClass = 'system';
      if (item.type === 'Inquiries') badgeClass = 'inquiries';
      if (item.type === 'Campaigns') badgeClass = 'campaigns';

      div.innerHTML = `
        <div class="unread-dot"></div>
        <div class="notif-icon-box">
          <i class="fas ${item.icon}"></i>
        </div>
        <div class="notif-content">
          <div class="notif-title-row">
            <span class="notif-title">${item.title}</span>
            <span class="notif-badge ${badgeClass}">${item.type}</span>
          </div>
          <span class="notif-desc">${item.desc}</span>
        </div>
        <div class="notif-meta">
          <span class="notif-time">${formatRelativeTime(item.time)}</span>
          <button class="btn-notif-delete" data-id="${item.id}" title="Delete Log">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      `;

      // Read action click row
      div.addEventListener('click', function (e) {
        // Prevent click if clicking the delete button
        if (e.target.closest('.btn-notif-delete')) return;
        
        if (!item.read) {
          item.read = true;
          saveData();
        }
      });

      // Delete action click button
      div.querySelector('.btn-notif-delete').addEventListener('click', function (e) {
        e.stopPropagation();
        const id = parseInt(this.getAttribute('data-id'));
        notifications = notifications.filter(n => n.id !== id);
        saveData();
        showToast('Notification deleted');
      });

      notifListEl.appendChild(div);
    });
  }

  // =============================================
  // FILTERS EVENT LISTENERS
  // =============================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      tabButtons.forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.getAttribute('data-filter');
      renderNotifications();
    });
  });

  searchInput.addEventListener('input', renderNotifications);

  // =============================================
  // PAGE ACTIONS (MARK READ & CLEAR)
  // =============================================
  markAllReadBtn.addEventListener('click', function () {
    const unreadExist = notifications.some(n => !n.read);
    if (!unreadExist) {
      showToast('All notifications are already read');
      return;
    }

    notifications.forEach(n => n.read = true);
    saveData();
    showToast('All alerts marked as read');
  });

  clearAllBtn.addEventListener('click', function () {
    if (notifications.length === 0) {
      showToast('Notification history is already empty');
      return;
    }

    if (confirm('Are you sure you want to permanently clear all notification history?')) {
      notifications = [];
      saveData();
      showToast('Notification history cleared');
    }
  });

  // =============================================
  // PROFILE DROPDOWN
  // =============================================
  const profileContainer = document.querySelector('.profile-dropdown-container');
  const profileBtn = document.getElementById('topProfileBtn');
  
  if (profileContainer && profileBtn) {
    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      profileContainer.classList.toggle('active');
    });
    
    document.addEventListener('click', function (e) {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      showToast('Logging out...');
      if (typeof API !== 'undefined') {
        await API.auth.logout();
      } else {
        setTimeout(function () {
          window.location.href = 'index.html';
        }, 1000);
      }
    });
  }

  // =============================================
  // INITIALIZATION
  // =============================================
  loadData();

  // Listen to storage events to sync unread badges across other pages in real-time
  window.addEventListener('storage', function (e) {
    if (e.key === 'notifications') {
      loadData();
    }
  });

})();
