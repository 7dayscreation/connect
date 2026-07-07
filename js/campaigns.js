/*
  Marketing & Campaigns Section — 7 Days Creation
  Logic for Campaign listings & metrics tables
*/

(function () {
  'use strict';

  // =============================================
  // DETECT PAGE TYPE
  // =============================================
  const isEmailPage = document.getElementById('tabEmailList') !== null || document.querySelector('title').textContent.includes('Email');
  const isWhatsappPage = document.getElementById('tabWaList') !== null || document.querySelector('title').textContent.includes('WhatsApp');

  // =============================================
  // DEFAULT MOCK CAMPAIGNS
  // =============================================
  const defaultEmailCampaigns = [
    { id: 1, name: "Summer Solstice Special", subject: "Exclusive 10% Off Signature Tower Bookings", audience: "All Inquiries", status: "Sent", date: "2026-06-20T10:00:00.000Z", openRate: "28.4%", clickRate: "5.1%" },
    { id: 2, name: "Weekly Project Digest", subject: "New property listings in Bodakdev", audience: "Subscriber", status: "Sent", date: "2026-06-22T08:30:00.000Z", openRate: "22.1%", clickRate: "3.9%" },
    { id: 3, name: "Followup: Walkin leads", subject: "Thank you for visiting Creation Residency", audience: "Walking Inquiry", status: "Scheduled", date: "2026-06-24T10:00:00.000Z", openRate: "—", clickRate: "—" }
  ];

  const defaultWhatsappCampaigns = [
    { id: 1, name: "VIP Project Launch Invite", template: "VIP Launch", audience: "Existing Client", status: "Sent", date: "2026-06-18T11:00:00.000Z", delivered: "99.4%", read: "89.2%" },
    { id: 2, name: "Site Visit Confirmation Request", template: "Site Visit", audience: "Web Inquiry", status: "Sent", date: "2026-06-21T15:30:00.000Z", delivered: "98.7%", read: "84.5%" }
  ];

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const tableBody = document.getElementById('campaignTableBody');
  const totalSentEl = document.getElementById('totalSent');
  const toastMessage = document.getElementById('toastMessage');

  // State
  let campaigns = [];

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
  function loadCampaigns() {
    if (isEmailPage) {
      const data = localStorage.getItem('email_campaigns');
      if (!data) {
        localStorage.setItem('email_campaigns', JSON.stringify(defaultEmailCampaigns));
        campaigns = [...defaultEmailCampaigns];
      } else {
        campaigns = JSON.parse(data);
      }
    } else if (isWhatsappPage) {
      const data = localStorage.getItem('whatsapp_campaigns');
      if (!data) {
        localStorage.setItem('whatsapp_campaigns', JSON.stringify(defaultWhatsappCampaigns));
        campaigns = [...defaultWhatsappCampaigns];
      } else {
        campaigns = JSON.parse(data);
      }
    }
    renderCampaignTable();
    updateCampaignMetrics();
  }

  function updateCampaignMetrics() {
    if (!totalSentEl) return;
    let base = isEmailPage ? 14285 : 8412;
    const sentCount = campaigns.filter(c => c.status === 'Sent').length;
    totalSentEl.textContent = (base + sentCount).toLocaleString();
  }

  // =============================================
  // DATE FORMATTER
  // =============================================
  function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString([], options);
  }

  // =============================================
  // TABLE RENDERING
  // =============================================
  function renderCampaignTable() {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    campaigns.forEach(c => {
      const tr = document.createElement('tr');
      const statusClass = c.status === 'Sent' ? 'sent' : (c.status === 'Scheduled' ? 'scheduled' : 'draft');
      
      if (isEmailPage) {
        tr.innerHTML = `
          <td><strong>${c.name}</strong></td>
          <td>${c.subject}</td>
          <td><span class="source-badge subscriber" style="border:none;">${c.audience}</span></td>
          <td><span class="status-badge-c ${statusClass}">${c.status}</span></td>
          <td>${formatDate(c.date)}</td>
          <td>
            <span style="font-weight:600;">${c.openRate}</span> Open / <span style="font-weight:600;">${c.clickRate}</span> Click
          </td>
        `;
      } else if (isWhatsappPage) {
        tr.innerHTML = `
          <td><strong>${c.name}</strong></td>
          <td>${c.template || 'Custom Message'}</td>
          <td><span class="source-badge subscriber" style="border:none;">${c.audience}</span></td>
          <td><span class="status-badge-c ${statusClass}">${c.status}</span></td>
          <td>${formatDate(c.date)}</td>
          <td>
            <span style="font-weight:600;">${c.delivered || '100%'}</span> Deliv / <span style="font-weight:600;">${c.read || '—'}</span> Read
          </td>
        `;
      }

      tableBody.appendChild(tr);
    });
  }

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

  // Logout simulator
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Logging out...');
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1000);
    });
  }

  // =============================================
  // NOTIFICATION BADGE SYNC
  // =============================================
  function updateGlobalBellBadge() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
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
  // INITIALIZATION
  // =============================================
  loadCampaigns();
  updateGlobalBellBadge();

  window.addEventListener('storage', function (e) {
    if (e.key === 'notifications') {
      updateGlobalBellBadge();
    }
  });

})();
