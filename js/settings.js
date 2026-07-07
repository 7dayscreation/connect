/*
  Admin Settings — Area Square Feet
  Settings Page Interactivity
  Handles: Tab navigation, form state, toggles, copy API keys,
           color pickers, user management, maintenance preview
*/

(function () {
  'use strict';

  // =============================================
  // SETTINGS NAV / TAB SWITCHING
  // =============================================
  var navItems = document.querySelectorAll('.settings-nav-item');
  var sections = document.querySelectorAll('.settings-section');

  function switchSection(targetId) {
    // Deactivate all
    navItems.forEach(function (n) { n.classList.remove('active'); });
    sections.forEach(function (s) { s.classList.remove('active'); });

    // Activate target
    var navItem = document.querySelector('.settings-nav-item[data-section="' + targetId + '"]');
    var section = document.getElementById(targetId);

    if (navItem) navItem.classList.add('active');
    if (section) {
      section.classList.add('active');
      section.style.animation = 'none';
      section.offsetHeight; // reflow
      section.style.animation = '';
    }

    // Update URL hash
    history.replaceState(null, '', '#' + targetId);
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      var target = this.getAttribute('data-section');
      if (target) switchSection(target);
    });
  });

  // Load from URL hash
  var hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    switchSection(hash);
  }

  // Handle URL hash changes while on the same page (e.g., from Profile Dropdown)
  window.addEventListener('hashchange', function () {
    var newHash = window.location.hash.replace('#', '');
    if (newHash && document.getElementById(newHash)) {
      switchSection(newHash);
    }
  });


  // =============================================
  // SIDEBAR ACTIVE STATE
  // =============================================
  var sidebarLinks = document.querySelectorAll('.sidebar-link[data-tooltip]');
  sidebarLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href') === '#') {
        e.preventDefault();
      }
      sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
      this.classList.add('active');
    });
  });


  // =============================================
  // TOGGLE SWITCHES
  // =============================================
  document.querySelectorAll('.toggle-input').forEach(function (input) {
    // Initial state on page load
    var card = input.closest('.settings-card');
    var dependents = card ? card.querySelectorAll('.toggle-dependent') : [];
    if (input.checked) {
      dependents.forEach(function (dep) {
        dep.style.maxHeight = 'none';
        dep.style.opacity = '1';
        dep.style.pointerEvents = 'auto';
      });
    }

    input.addEventListener('change', function () {
      var card = this.closest('.settings-card');
      var dependents = card ? card.querySelectorAll('.toggle-dependent') : [];
      dependents.forEach(function (dep) {
        if (input.checked) {
          // Temporarily set height to scrollHeight for a smooth CSS slide-down animation
          dep.style.maxHeight = dep.scrollHeight + 'px';
          dep.style.opacity = '1';
          dep.style.pointerEvents = 'auto';
          
          // Set height to 'none' after animation ends so responsive grid collapses correctly on resize
          var onTransitionEnd = function () {
            if (input.checked) {
              dep.style.maxHeight = 'none';
            }
            dep.removeEventListener('transitionend', onTransitionEnd);
          };
          dep.addEventListener('transitionend', onTransitionEnd);
        } else {
          // If height is 'none', restore scrollHeight first to trigger a smooth slide-up animation
          dep.style.maxHeight = dep.scrollHeight + 'px';
          dep.offsetHeight; // force reflow
          dep.style.maxHeight = '0';
          dep.style.opacity = '0';
          dep.style.pointerEvents = 'none';
        }
      });
    });
  });


  // =============================================
  // API KEY — SHOW/HIDE TOGGLE
  // =============================================
  document.querySelectorAll('.api-toggle-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = this.closest('.api-key-field');
      var input = field.querySelector('input');
      var icon = this.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });
  });


  // =============================================
  // API KEY — COPY TO CLIPBOARD
  // =============================================
  document.querySelectorAll('.api-copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var field = this.closest('.api-key-field');
      var input = field.querySelector('input');
      var originalType = input.type;
      input.type = 'text';
      input.select();

      var self = this;
      navigator.clipboard.writeText(input.value).then(function () {
        self.classList.add('copied');
        var icon = self.querySelector('i');
        var origClass = icon.className;
        icon.className = 'fas fa-check';
        self.querySelector('span').textContent = 'Copied';

        setTimeout(function () {
          self.classList.remove('copied');
          icon.className = origClass;
          self.querySelector('span').textContent = 'Copy';
        }, 2000);
      });

      input.type = originalType;
    });
  });


  // =============================================
  // COLOR PICKER SYNC
  // =============================================
  document.querySelectorAll('.color-picker-group').forEach(function (group) {
    var colorInput = group.querySelector('input[type="color"]');
    var hexInput = group.querySelector('.color-hex-input');

    if (colorInput && hexInput) {
      colorInput.addEventListener('input', function () {
        hexInput.value = this.value.toUpperCase();
      });
      hexInput.addEventListener('input', function () {
        var val = this.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          colorInput.value = val;
        }
      });
    }
  });


  // =============================================
  // FONT PREVIEW
  // =============================================
  var fontSelect = document.getElementById('fontFamily');
  var fontPreview = document.getElementById('fontPreview');
  if (fontSelect && fontPreview) {
    fontSelect.addEventListener('change', function () {
      fontPreview.style.fontFamily = "'" + this.value + "', sans-serif";
      fontPreview.textContent = 'The quick brown fox jumps over the lazy dog — ' + this.value;
    });
  }

  // Font size slider sync
  document.querySelectorAll('.size-slider').forEach(function (slider) {
    var display = slider.parentElement.querySelector('.size-value');
    if (display) {
      slider.addEventListener('input', function () {
        display.textContent = this.value + 'px';
      });
    }
  });


  // =============================================
  // ADD USER — PASSWORD VISIBILITY
  // =============================================
  var toggleNewPwd = document.getElementById('toggleNewUserPwd');
  if (toggleNewPwd) {
    toggleNewPwd.addEventListener('click', function () {
      var input = document.getElementById('newUserPassword');
      var icon = this.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });
  }


  // =============================================
  // MAINTENANCE MODE PREVIEW
  // =============================================
  var maintToggle = document.getElementById('maintenanceToggle');
  var maintPreview = document.getElementById('maintenancePreview');
  var maintMsg = document.getElementById('maintenanceMessage');

  if (maintToggle && maintPreview) {
    maintToggle.addEventListener('change', function () {
      if (this.checked) {
        maintPreview.style.display = 'block';
        maintPreview.style.animation = 'fadeUp 0.3s ease both';
      } else {
        maintPreview.style.display = 'none';
      }
    });
  }

  if (maintMsg && maintPreview) {
    maintMsg.addEventListener('input', function () {
      var previewText = maintPreview.querySelector('.preview-message');
      if (previewText) {
        previewText.textContent = this.value || 'We are currently performing scheduled maintenance.';
      }
    });
  }


  // =============================================
  // FORM SAVE — SHOW TOAST
  // =============================================
  document.querySelectorAll('.btn-save').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var self = this;
      var origText = self.textContent;

      // Loading state
      self.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:6px;"></i> Saving...';
      self.disabled = true;
      self.style.opacity = '0.7';

      // Simulate save
      setTimeout(function () {
        self.innerHTML = origText;
        self.disabled = false;
        self.style.opacity = '1';
        showSaveToast('Settings saved successfully!');
      }, 1200);
    });
  });

  // Test Connection buttons
  document.querySelectorAll('.btn-test').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var self = this;
      var origText = self.innerHTML;

      self.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:6px;"></i> Testing...';
      self.disabled = true;

      setTimeout(function () {
        self.innerHTML = origText;
        self.disabled = false;
        showSaveToast('Connection test successful!');

        // Update nearest status badge
        var card = self.closest('.settings-card');
        var badge = card ? card.querySelector('.status-badge') : null;
        if (badge) {
          badge.className = 'status-badge connected';
          badge.innerHTML = '<span class="status-dot"></span> Connected';
        }
      }, 2000);
    });
  });


  // =============================================
  // TOAST NOTIFICATION
  // =============================================
  function showSaveToast(message) {
    // Remove existing toast
    var existing = document.querySelector('.save-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.innerHTML = '<i class="fas fa-check-circle lime-check"></i> ' + message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }


  // =============================================
  // GENERATE AUTHENTICATOR SECRET (demo)
  // =============================================
  var generateAuthBtn = document.getElementById('generateAuthSecret');
  if (generateAuthBtn) {
    generateAuthBtn.addEventListener('click', function () {
      var secretDisplay = document.getElementById('authSecretKey');
      var qrPlaceholder = document.getElementById('authQrCode');

      // Generate random base32-like key
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      var key = '';
      for (var i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
        if ((i + 1) % 4 === 0 && i < 31) key += ' ';
      }

      if (secretDisplay) secretDisplay.textContent = key;
      if (qrPlaceholder) {
        qrPlaceholder.innerHTML = '<div style="width:180px;height:180px;background:#f0f0f0;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#71717a;border:2px dashed #e5e5e5;"><i class="fas fa-qrcode" style="font-size:48px;color:#d4d4d4;"></i></div><p style="font-size:12px;color:#71717a;margin-top:8px;">Scan with Google Authenticator</p>';
      }

      showSaveToast('Authenticator secret generated!');
    });
  }


  // =============================================
  // SEARCH SETTINGS
  // =============================================
  var searchInput = document.getElementById('settingsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();

      if (!query) {
        // Show all nav items, restore current section
        navItems.forEach(function (n) { n.style.display = ''; });
        return;
      }

      // Filter nav items by text content
      navItems.forEach(function (n) {
        var text = n.textContent.toLowerCase();
        n.style.display = text.indexOf(query) !== -1 ? '' : 'none';
      });
    });
  }

  // =============================================
  // PROFILE DROPDOWN TOGGLE
  // =============================================
  var profileContainer = document.querySelector('.profile-dropdown-container');
  var profileBtn = document.getElementById('topProfileBtn');
  
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
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showSaveToast('Logging out...');
      setTimeout(function () {
        window.location.href = 'index.html'; // back to main page
      }, 1000);
    });
  }

  // =============================================
  // MOBILE MENU TOGGLE
  // =============================================
  var menuBtn = document.getElementById('mobileMenuBtn');
  if (menuBtn) {
    // Create overlay dynamically if it doesn't exist
    var overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.body.classList.toggle('sidebar-open');
    });

    overlay.addEventListener('click', function () {
      document.body.classList.remove('sidebar-open');
    });
  }

  // =============================================
  // RESPONSIVE DROPDOWN NAVIGATION MENU
  // =============================================
  var settingsNav = document.getElementById('settingsNav');
  var navTrigger = document.getElementById('settingsNavTrigger');
  var currentLabel = document.getElementById('currentSectionLabel');

  if (settingsNav && navTrigger) {
    // Open/Close dropdown
    navTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      settingsNav.classList.toggle('open');
    });

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!settingsNav.contains(e.target)) {
        settingsNav.classList.remove('open');
      }
    });

    // Function to sync trigger button content with active nav item
    var syncTriggerLabel = function () {
      try {
        var activeItem = settingsNav.querySelector('.settings-nav-item.active');
        if (activeItem && currentLabel) {
          var iconHtml = '';
          var iconEl = activeItem.querySelector('.nav-icon');
          if (iconEl) {
            iconHtml = iconEl.innerHTML;
          }
          
          // Clone the active item to cleanly extract text content without badges or icons
          var clone = activeItem.cloneNode(true);
          var icon = clone.querySelector('.nav-icon');
          if (icon) icon.parentNode.removeChild(icon);
          var badge = clone.querySelector('.nav-badge');
          if (badge) badge.parentNode.removeChild(badge);
          
          var text = clone.textContent || clone.innerText || '';
          text = text.trim();
          
          currentLabel.innerHTML = (iconHtml ? '<span class="nav-icon">' + iconHtml + '</span>' : '') + ' ' + text;
        }
      } catch (err) {
        console.error('Error syncing settings trigger label:', err);
      }
    };

    // Sync on initial load
    syncTriggerLabel();

    // Sync when navigation item clicked
    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        settingsNav.classList.remove('open');
        setTimeout(syncTriggerLabel, 50); // slight timeout to allow class change
      });
    });

    // Sync on hashchange
    window.addEventListener('hashchange', function () {
      setTimeout(syncTriggerLabel, 50);
    });
  }

  // =============================================
  // NOTIFICATION BADGE SYNC
  // =============================================
  function updateGlobalBellBadge() {
    var notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    var unreadCount = notifications.filter(function(n) { return !n.read; }).length;
    var bellBadges = document.querySelectorAll('.notif-badge');
    bellBadges.forEach(function(badge) {
      if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    });
  }
  updateGlobalBellBadge();

  window.addEventListener('storage', function (e) {
    if (e.key === 'notifications') {
      updateGlobalBellBadge();
    }
  });

})();
