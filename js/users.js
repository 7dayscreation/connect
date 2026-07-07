/*
  Admin Users Inquiry Section — 7 Days Creation
  Filtering, Advanced Search, Export, Side-drawer, and Synchronization
*/

(function () {
  'use strict';

  // =============================================
  // DEFAULT INQUIRIES MOCK DATA
  // =============================================
  const defaultInquiries = [
    { id: 1, firstName: "Rahul", surname: "Mehta", phone: "9825012345", email: "rahul.mehta@example.com", interestedProject: "7 Days Heights", inquiryType: "Web Inquiry", date: "2026-06-21T09:30:00.000Z" },
    { id: 2, firstName: "Sneha", surname: "Patel", phone: "9012345678", email: "sneha.patel@example.com", interestedProject: "Creation Residency", inquiryType: "Walking Inquiry", date: "2026-06-22T14:15:00.000Z" },
    { id: 3, firstName: "Vikram", surname: "Shah", phone: "8980123456", email: "vikram.shah@example.com", interestedProject: "Signature Tower", inquiryType: "Subscriber", date: "2026-06-23T11:00:00.000Z" },
    { id: 4, firstName: "Neha", surname: "Sharma", phone: "7676767676", email: "neha.sharma@example.com", interestedProject: "Royal Meadows", inquiryType: "Existing Client", date: "2026-06-20T10:45:00.000Z" }
  ];

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const tableBody = document.getElementById('inquiriesTableBody');
  const emptyState = document.getElementById('emptyState');
  
  // Metrics
  const countAllEl = document.getElementById('countAll');
  const countWebEl = document.getElementById('countWeb');
  const countWalkingEl = document.getElementById('countWalking');
  const countSubscriberEl = document.getElementById('countSubscriber');
  const countClientEl = document.getElementById('countClient');

  // Filters
  const tabButtons = document.querySelectorAll('.filter-tab');
  const searchQuery = document.getElementById('searchQuery');
  const filterProject = document.getElementById('filterProject');
  const filterDate = document.getElementById('filterDate');

  // Actions
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');

  // Drawer
  const openDrawerBtn = document.getElementById('openDrawerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const sideDrawer = document.getElementById('sideDrawer');
  const drawerForm = document.getElementById('drawerForm');
  const drawerSubmitBtn = document.getElementById('drawerSubmitBtn');

  // Drawer Fields
  const drawerFirstName = document.getElementById('drawerFirstName');
  const drawerSurname = document.getElementById('drawerSurname');
  const drawerPhone = document.getElementById('drawerPhone');
  const drawerEmail = document.getElementById('drawerEmail');
  const drawerProject = document.getElementById('drawerProject');
  const drawerType = document.getElementById('drawerType');

  // Toast
  const toastMessage = document.getElementById('toastMessage');

  // State
  let inquiries = [];
  let activeTab = 'all';

  // =============================================
  // DATA MANAGEMENT
  // =============================================
  function loadData() {
    const data = localStorage.getItem('inquiries');
    if (!data) {
      localStorage.setItem('inquiries', JSON.stringify(defaultInquiries));
      inquiries = [...defaultInquiries];
    } else {
      inquiries = JSON.parse(data);
    }
    updateMetrics();
    renderTable();
  }

  function saveData() {
    localStorage.setItem('inquiries', JSON.stringify(inquiries));
    updateMetrics();
    renderTable();
  }

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
  // METRICS UPDATE
  // =============================================
  function updateMetrics() {
    if (!countAllEl) return;
    countAllEl.textContent = inquiries.length;
    countWebEl.textContent = inquiries.filter(x => x.inquiryType === 'Web Inquiry').length;
    countWalkingEl.textContent = inquiries.filter(x => x.inquiryType === 'Walking Inquiry').length;
    countSubscriberEl.textContent = inquiries.filter(x => x.inquiryType === 'Subscriber').length;
    countClientEl.textContent = inquiries.filter(x => x.inquiryType === 'Existing Client').length;
  }

  // =============================================
  // DATE FORMATTER
  // =============================================
  function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const optionsTime = { hour: '2-digit', minute: '2-digit' };
    const timeStr = date.toLocaleTimeString([], optionsTime);

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${date.toLocaleDateString([], optionsDate)}, ${timeStr}`;
  }

  // =============================================
  // RENDERING
  // =============================================
  function renderTable() {
    if (!tableBody) return;

    // Get filters
    const query = searchQuery.value.toLowerCase().trim();
    const proj = filterProject.value;
    const timeRange = filterDate.value;

    const filtered = inquiries.filter(item => {
      // 1. Tab source filter
      if (activeTab !== 'all' && item.inquiryType !== activeTab) {
        return false;
      }

      // 2. Search query filter (Name, Phone, Email)
      if (query) {
        const fullName = `${item.firstName} ${item.surname}`.toLowerCase();
        const emailMatch = item.email.toLowerCase().includes(query);
        const phoneMatch = item.phone.includes(query);
        if (!fullName.includes(query) && !emailMatch && !phoneMatch) {
          return false;
        }
      }

      // 3. Project filter
      if (proj && item.interestedProject !== proj) {
        return false;
      }

      // 4. Date filter
      if (timeRange) {
        const itemDate = new Date(item.date);
        const now = new Date();
        const diffTime = Math.abs(now - itemDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (timeRange === 'today' && itemDate.toDateString() !== now.toDateString()) {
          return false;
        }
        if (timeRange === 'week' && diffDays > 7) {
          return false;
        }
        if (timeRange === 'month' && diffDays > 30) {
          return false;
        }
      }

      return true;
    });

    // Populate rows
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      return;
    } else {
      emptyState.style.display = 'none';
    }

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      
      // Determine badge class
      let badgeClass = 'web-inquiry';
      if (item.inquiryType === 'Walking Inquiry') badgeClass = 'walking-inquiry';
      if (item.inquiryType === 'Subscriber') badgeClass = 'subscriber';
      if (item.inquiryType === 'Existing Client') badgeClass = 'existing-client';

      tr.innerHTML = `
        <td><strong>${item.firstName} ${item.surname}</strong></td>
        <td>${item.phone}</td>
        <td>${item.email}</td>
        <td>${item.interestedProject}</td>
        <td><span class="source-badge ${badgeClass}">${item.inquiryType}</span></td>
        <td>${formatDate(item.date)}</td>
        <td style="text-align: right;">
          <button class="btn-delete" data-id="${item.id}" title="Delete Inquiry">
            <i class="fas fa-trash-can"></i>
          </button>
        </td>
      `;

      // Hook up delete
      tr.querySelector('.btn-delete').addEventListener('click', function () {
        const id = parseInt(this.getAttribute('data-id'));
        if (confirm('Are you sure you want to delete this inquiry?')) {
          inquiries = inquiries.filter(x => x.id !== id);
          saveData();
          showToast('Inquiry deleted successfully!');
        }
      });

      tableBody.appendChild(tr);
    });
  }

  // =============================================
  // EVENT LISTENERS (FILTERS)
  // =============================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      tabButtons.forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      activeTab = this.getAttribute('data-type');
      renderTable();
    });
  });

  searchQuery.addEventListener('input', renderTable);
  filterProject.addEventListener('change', renderTable);
  filterDate.addEventListener('change', renderTable);

  // =============================================
  // EXPORTS
  // =============================================
  exportCsvBtn.addEventListener('click', function () {
    if (inquiries.length === 0) {
      showToast('No inquiries to export');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,First Name,Surname,Phone,Email,Interested Project,Inquiry Type,Date Logged\n";

    inquiries.forEach(item => {
      const row = [
        item.id,
        `"${item.firstName}"`,
        `"${item.surname}"`,
        `"${item.phone}"`,
        `"${item.email}"`,
        `"${item.interestedProject}"`,
        `"${item.inquiryType}"`,
        `"${item.date}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inquiries_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV export downloaded!');
  });

  exportJsonBtn.addEventListener('click', function () {
    if (inquiries.length === 0) {
      showToast('No inquiries to export');
      return;
    }

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inquiries, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `inquiries_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('JSON export downloaded!');
  });

  // =============================================
  // DRAWER TOGGLE
  // =============================================
  function openDrawer() {
    drawerOverlay.classList.add('active');
    sideDrawer.classList.add('active');
    setTimeout(() => drawerFirstName.focus(), 150);
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('active');
    sideDrawer.classList.remove('active');
    drawerForm.reset();
  }

  openDrawerBtn.addEventListener('click', openDrawer);
  closeDrawerBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // =============================================
  // DRAWER FORM SUBMISSION
  // =============================================
  drawerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let hasError = false;

    // Validate fields
    [drawerFirstName, drawerSurname, drawerPhone, drawerEmail, drawerProject, drawerType].forEach(el => {
      el.classList.remove('error');
      if (!el.value) {
        el.classList.add('error');
        hasError = true;
      }
    });

    if (hasError) {
      showToast('Please fill in all details.');
      return;
    }

    // Save simulation
    drawerSubmitBtn.classList.add('loading');
    drawerSubmitBtn.disabled = true;

    setTimeout(() => {
      const newInquiry = {
        id: Date.now(),
        firstName: drawerFirstName.value.trim(),
        surname: drawerSurname.value.trim(),
        phone: drawerPhone.value.trim(),
        email: drawerEmail.value.trim(),
        interestedProject: drawerProject.value,
        inquiryType: drawerType.value,
        date: new Date().toISOString()
      };

      inquiries.unshift(newInquiry);
      saveData();

      // Append to notification list
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        type: "Inquiries",
        icon: "fa-user-plus",
        title: "New Inquiry Logged (Admin)",
        desc: `Sales team logged ${newInquiry.firstName} ${newInquiry.surname} for project '${newInquiry.interestedProject}'.`,
        time: new Date().toISOString(),
        read: false
      };
      notifs.unshift(newNotif);
      localStorage.setItem('notifications', JSON.stringify(notifs));

      drawerSubmitBtn.classList.remove('loading');
      drawerSubmitBtn.disabled = false;
      closeDrawer();
      showToast('New inquiry recorded successfully!');
    }, 1000);
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
  // INITIALIZATION
  // =============================================
  loadData();

  // Listen to storage events to sync table in real-time across multiple tabs
  window.addEventListener('storage', function (e) {
    if (e.key === 'inquiries') {
      loadData();
    }
  });

})();
