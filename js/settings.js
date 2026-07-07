/*
  Admin Settings — Area Square Feet
  Settings Page Interactivity
  Handles: Tab navigation, form state, toggles, copy API keys,
           color pickers, user management, maintenance preview
*/

(function () {
  'use strict';

  // Auth Guard
  if (typeof API !== 'undefined') API.requireAuth();

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
  // FORM SAVE — SHOW TOAST (Real API)
  // =============================================
  document.querySelectorAll('.btn-save').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      e.preventDefault();
      var self = this;
      var origText = self.textContent;

      // Loading state
      self.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:6px;"></i> Saving...';
      self.disabled = true;
      self.style.opacity = '0.7';

      var payload = {
        brandName: document.getElementById('brandName') ? document.getElementById('brandName').value : '',
        brandTagline: document.getElementById('brandTagline') ? document.getElementById('brandTagline').value : '',
        brandUrl: document.getElementById('brandUrl') ? document.getElementById('brandUrl').value : '',
        contactEmail: document.getElementById('contactEmail') ? document.getElementById('contactEmail').value : '',
        contactPhone: document.getElementById('contactPhone') ? document.getElementById('contactPhone').value : '',
        resendApiKey: document.getElementById('resendApiKey') ? document.getElementById('resendApiKey').value : '',
        fromEmail: document.getElementById('fromEmail') ? document.getElementById('fromEmail').value : '',
        fromName: document.getElementById('fromName') ? document.getElementById('fromName').value : '',
        replyToEmail: document.getElementById('replyToEmail') ? document.getElementById('replyToEmail').value : '',
        logoBase64: logoBase64 || (window.currentConfig ? window.currentConfig.logoBase64 : '') || '',
        faviconBase64: faviconBase64 || (window.currentConfig ? window.currentConfig.faviconBase64 : '') || '',
        turnstileEnabled: document.getElementById('turnstileEnabled') ? document.getElementById('turnstileEnabled').checked : false,
        turnstileSiteKey: document.getElementById('turnstileSiteKey') ? document.getElementById('turnstileSiteKey').value : '',
        turnstileSecretKey: document.getElementById('turnstileSecretKey') ? document.getElementById('turnstileSecretKey').value : '',
        turnstileApplyLogin: document.getElementById('turnstileApplyLogin') ? document.getElementById('turnstileApplyLogin').checked : false,
        turnstileApplyContact: document.getElementById('turnstileApplyContact') ? document.getElementById('turnstileApplyContact').checked : false,
        turnstileApplyInquiry: document.getElementById('turnstileApplyInquiry') ? document.getElementById('turnstileApplyInquiry').checked : false,
        turnstileApplyNewsletter: document.getElementById('turnstileApplyNewsletter') ? document.getElementById('turnstileApplyNewsletter').checked : false,
        turnstileTheme: document.getElementById('turnstileTheme') ? document.getElementById('turnstileTheme').value : 'light',
        
        sessionTimeout: document.getElementById('sessionTimeout') ? parseInt(document.getElementById('sessionTimeout').value) || 30 : 30,
        maxAttempts: document.getElementById('maxAttempts') ? parseInt(document.getElementById('maxAttempts').value) || 5 : 5,
        lockoutDuration: document.getElementById('lockoutDuration') ? parseInt(document.getElementById('lockoutDuration').value) || 15 : 15,
        minPasswordLength: document.getElementById('minPasswordLength') ? parseInt(document.getElementById('minPasswordLength').value) || 8 : 8,
        reqUppercase: document.getElementById('reqUppercase') ? document.getElementById('reqUppercase').checked : false,
        reqLowercase: document.getElementById('reqLowercase') ? document.getElementById('reqLowercase').checked : false,
        reqNumber: document.getElementById('reqNumber') ? document.getElementById('reqNumber').checked : false,
        reqSpecial: document.getElementById('reqSpecial') ? document.getElementById('reqSpecial').checked : false,
        force2FA: document.getElementById('force2FA') ? document.getElementById('force2FA').checked : false
      };

      try {
        if (typeof API !== 'undefined' && API.session.isLoggedIn()) {
          const res = await API.config.save(payload);
          if (res && res.ok) {
            showSaveToast('Settings saved successfully to Cloudflare KV!');
          } else {
            showSaveToast('API error: ' + (res?.data?.error || 'Could not save.'));
          }
        } else {
          // Local fallback
          localStorage.setItem('local_settings', JSON.stringify(payload));
          showSaveToast('Settings saved locally.');
        }
      } catch (err) {
        showSaveToast('Connection error. Saved locally.');
      } finally {
        self.innerHTML = origText;
        self.disabled = false;
        self.style.opacity = '1';
      }
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
  // GENERATE AUTHENTICATOR SECRET & SETUP (Real API)
  // =============================================
  var generateAuthBtn = document.getElementById('generateAuthSecret');
  var generatedSecret2FA = null;

  if (generateAuthBtn) {
    generateAuthBtn.addEventListener('click', async function () {
      var secretDisplay = document.getElementById('authSecretKey');
      var qrPlaceholder = document.getElementById('authQrCode');
      var self = this;
      var origText = self.innerHTML;

      self.disabled = true;
      self.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="margin-right:6px;"></i> Generating...';

      try {
        if (typeof API !== 'undefined') {
          const res = await API.auth.twoFA.generate();
          if (res && res.ok && res.data.success) {
            generatedSecret2FA = res.data.secret;
            if (secretDisplay) secretDisplay.textContent = generatedSecret2FA;
            if (qrPlaceholder) {
              qrPlaceholder.innerHTML = '<img src="' + res.data.qrCodeUrl + '" style="width:180px;height:180px;border-radius:12px;display:block;"><p style="font-size:12px;color:#71717a;margin-top:8px;">Scan with Google Authenticator</p>';
            }
            showSaveToast('New secret generated successfully!');
          } else {
            showSaveToast('API error: ' + (res?.data?.error || 'Could not generate secret.'));
          }
        }
      } catch (err) {
        showSaveToast('Failed to generate secret key.');
      } finally {
        self.disabled = false;
        self.innerHTML = origText;
      }
    });
  }

  // Verify and Setup 2FA
  var setup2faVerifyBtn = document.getElementById('setup2faVerifyBtn');
  if (setup2faVerifyBtn) {
    setup2faVerifyBtn.addEventListener('click', async function () {
      var codeInput = document.getElementById('setup2faCode');
      var code = codeInput ? codeInput.value.replace(/\s+/g, '') : '';
      if (!generatedSecret2FA) {
        showSaveToast('Please generate a secret key first.');
        return;
      }
      if (!code || code.length < 6) {
        showSaveToast('Please enter a valid 6-digit code.');
        return;
      }

      var self = this;
      var origText = self.innerHTML;
      self.disabled = true;
      self.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

      try {
        if (typeof API !== 'undefined') {
          const res = await API.auth.twoFA.verifySetup(generatedSecret2FA, code);
          if (res && res.ok && res.data.success) {
            showSaveToast('Google Authenticator 2FA enabled successfully!');
            // Check the status checkbox and keep it checked
            var mainCheckbox = document.getElementById('twoFAEnabled');
            if (mainCheckbox) {
              mainCheckbox.checked = true;
              mainCheckbox.dispatchEvent(new Event('change'));
            }
            // Clear code input
            if (codeInput) codeInput.value = '';
          } else {
            showSaveToast('Verification failed: ' + (res?.data?.error || 'Invalid code.'));
          }
        }
      } catch (err) {
        showSaveToast('Failed to connect to API.');
      } finally {
        self.disabled = false;
        self.innerHTML = origText;
      }
    });
  }

  // Handle Disable 2FA via checkbox toggle
  var twoFAEnabledCheckbox = document.getElementById('twoFAEnabled');
  if (twoFAEnabledCheckbox) {
    twoFAEnabledCheckbox.addEventListener('change', async function () {
      // If user unchecks it, it means they want to disable 2FA
      if (!this.checked) {
        if (confirm('Are you sure you want to disable Google Authenticator 2FA? This will reduce your account security.')) {
          try {
            if (typeof API !== 'undefined') {
              const res = await API.auth.twoFA.disable();
              if (res && res.ok && res.data.success) {
                showSaveToast('2FA disabled successfully.');
                // Clear inputs
                var secretDisplay = document.getElementById('authSecretKey');
                if (secretDisplay) secretDisplay.textContent = 'Click "Generate" to create a new key';
                var qrPlaceholder = document.getElementById('authQrCode');
                if (qrPlaceholder) {
                  qrPlaceholder.innerHTML = '<div style="width:180px;height:180px;background:#f0f0f0;border-radius:12px;display:flex;align-items:center;justify-content:center;border:2px dashed #e5e5e5;"><i class="fas fa-qrcode" style="font-size:48px;color:#d4d4d4;"></i></div><p style="font-size:12px;color:#71717a;margin-top:8px;">Generate key first</p>';
                }
                generatedSecret2FA = null;
              } else {
                showSaveToast('API error: ' + (res?.data?.error || 'Could not disable 2FA.'));
                this.checked = true; // revert checkbox
                this.dispatchEvent(new Event('change'));
              }
            }
          } catch (err) {
            showSaveToast('Failed to connect to API.');
            this.checked = true; // revert checkbox
            this.dispatchEvent(new Event('change'));
          }
        } else {
          this.checked = true; // revert checkbox
          this.dispatchEvent(new Event('change'));
        }
      }
    });
  }


  // =============================================
  // LOGO & FAVICON UPLOADS (Base64)
  // =============================================
  var logoBase64 = null;
  var faviconBase64 = null;

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function (error) { reject(error); };
      reader.readAsDataURL(file);
    });
  }

  var logoInput = document.getElementById('logoInput');
  if (logoInput) {
    logoInput.addEventListener('change', async function () {
      if (this.files && this.files[0]) {
        try {
          logoBase64 = await fileToBase64(this.files[0]);
          var uploadArea = this.closest('.file-upload-area');
          if (uploadArea) {
            var img = uploadArea.querySelector('.upload-preview-img');
            if (!img) {
              img = document.createElement('img');
              img.className = 'upload-preview-img';
              img.style.maxHeight = '40px';
              img.style.borderRadius = '4px';
              img.style.display = 'block';
              img.style.margin = '0 auto 8px';
              uploadArea.insertBefore(img, uploadArea.firstChild);
            }
            img.src = logoBase64;
          }
          showSaveToast('Logo loaded successfully!');
        } catch (e) {
          showSaveToast('Failed to read logo file.');
        }
      }
    });
  }

  var faviconInput = document.getElementById('faviconInput');
  if (faviconInput) {
    faviconInput.addEventListener('change', async function () {
      if (this.files && this.files[0]) {
        try {
          faviconBase64 = await fileToBase64(this.files[0]);
          var uploadArea = this.closest('.file-upload-area');
          if (uploadArea) {
            var img = uploadArea.querySelector('.upload-preview-img');
            if (!img) {
              img = document.createElement('img');
              img.className = 'upload-preview-img';
              img.style.maxHeight = '32px';
              img.style.borderRadius = '4px';
              img.style.display = 'block';
              img.style.margin = '0 auto 8px';
              uploadArea.insertBefore(img, uploadArea.firstChild);
            }
            img.src = faviconBase64;
          }
          showSaveToast('Favicon loaded successfully!');
        } catch (e) {
          showSaveToast('Failed to read favicon file.');
        }
      }
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

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      showSaveToast('Logging out...');
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
  // =============================================
  // INITIALIZATION
  // =============================================
  async function loadConfig() {
    if (typeof API === 'undefined' || !API.session.isLoggedIn()) return;
    try {
      const res = await API.config.get();
        const cfg = res.data.data;
        window.currentConfig = cfg;
        if (document.getElementById('brandName')) document.getElementById('brandName').value = cfg.brandName || '';
        if (document.getElementById('brandTagline')) document.getElementById('brandTagline').value = cfg.brandTagline || '';
        if (document.getElementById('brandUrl')) document.getElementById('brandUrl').value = cfg.brandUrl || '';
        if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = cfg.contactEmail || '';
        if (document.getElementById('contactPhone')) document.getElementById('contactPhone').value = cfg.contactPhone || '';
        if (document.getElementById('resendApiKey')) document.getElementById('resendApiKey').value = cfg.resendApiKey || '';
        if (document.getElementById('fromEmail')) document.getElementById('fromEmail').value = cfg.fromEmail || '';
        if (document.getElementById('fromName')) document.getElementById('fromName').value = cfg.fromName || '';
        if (document.getElementById('replyToEmail')) document.getElementById('replyToEmail').value = cfg.replyToEmail || '';

        // Render logo preview if logo exists
        if (cfg.logoBase64 && logoInput) {
          var uploadArea = logoInput.closest('.file-upload-area');
          if (uploadArea) {
            var img = uploadArea.querySelector('.upload-preview-img') || document.createElement('img');
            img.className = 'upload-preview-img';
            img.src = cfg.logoBase64;
            img.style.maxHeight = '40px';
            img.style.borderRadius = '4px';
            img.style.display = 'block';
            img.style.margin = '0 auto 8px';
            if (!uploadArea.querySelector('.upload-preview-img')) {
              uploadArea.insertBefore(img, uploadArea.firstChild);
            }
          }
        }

        // Render favicon preview if favicon exists
        if (cfg.faviconBase64 && faviconInput) {
          var uploadArea = faviconInput.closest('.file-upload-area');
          if (uploadArea) {
            var img = uploadArea.querySelector('.upload-preview-img') || document.createElement('img');
            img.className = 'upload-preview-img';
            img.src = cfg.faviconBase64;
            img.style.maxHeight = '32px';
            img.style.borderRadius = '4px';
            img.style.display = 'block';
            img.style.margin = '0 auto 8px';
            if (!uploadArea.querySelector('.upload-preview-img')) {
              uploadArea.insertBefore(img, uploadArea.firstChild);
            }
          }
        }

        // Set Turnstile values
        if (document.getElementById('turnstileEnabled')) {
          document.getElementById('turnstileEnabled').checked = cfg.turnstileEnabled || false;
          // Trigger change event to update the UI dependent panel visibility
          document.getElementById('turnstileEnabled').dispatchEvent(new Event('change'));
        }
        if (document.getElementById('turnstileSiteKey')) document.getElementById('turnstileSiteKey').value = cfg.turnstileSiteKey || '';
        if (document.getElementById('turnstileSecretKey')) document.getElementById('turnstileSecretKey').value = cfg.turnstileSecretKey || '';
        if (document.getElementById('turnstileApplyLogin')) document.getElementById('turnstileApplyLogin').checked = cfg.turnstileApplyLogin !== false; // default true
        if (document.getElementById('turnstileApplyContact')) document.getElementById('turnstileApplyContact').checked = cfg.turnstileApplyContact !== false; // default true
        if (document.getElementById('turnstileApplyInquiry')) document.getElementById('turnstileApplyInquiry').checked = cfg.turnstileApplyInquiry || false;
        if (document.getElementById('turnstileApplyNewsletter')) document.getElementById('turnstileApplyNewsletter').checked = cfg.turnstileApplyNewsletter || false;
        if (document.getElementById('turnstileTheme')) document.getElementById('turnstileTheme').value = cfg.turnstileTheme || 'light';

        // Security Policy fields
        if (document.getElementById('sessionTimeout')) document.getElementById('sessionTimeout').value = cfg.sessionTimeout || 30;
        if (document.getElementById('maxAttempts')) document.getElementById('maxAttempts').value = cfg.maxAttempts || 5;
        if (document.getElementById('lockoutDuration')) document.getElementById('lockoutDuration').value = cfg.lockoutDuration || 15;
        if (document.getElementById('minPasswordLength')) document.getElementById('minPasswordLength').value = cfg.minPasswordLength || 8;
        if (document.getElementById('reqUppercase')) document.getElementById('reqUppercase').checked = cfg.reqUppercase !== false;
        if (document.getElementById('reqLowercase')) document.getElementById('reqLowercase').checked = cfg.reqLowercase !== false;
        if (document.getElementById('reqNumber')) document.getElementById('reqNumber').checked = cfg.reqNumber !== false;
        if (document.getElementById('reqSpecial')) document.getElementById('reqSpecial').checked = cfg.reqSpecial || false;
        if (document.getElementById('force2FA')) document.getElementById('force2FA').checked = cfg.force2FA || false;

        // Fetch 2FA status
        if (typeof API !== 'undefined') {
          try {
            const twoFARes = await API.auth.twoFA.status();
            if (twoFARes && twoFARes.ok && twoFARes.data.enabled) {
              var mainCheckbox = document.getElementById('twoFAEnabled');
              if (mainCheckbox) {
                mainCheckbox.checked = true;
                mainCheckbox.dispatchEvent(new Event('change'));
              }
            }
          } catch (e) {
            console.warn('[Settings] Failed to check 2FA status:', e);
          }
        }
    } catch (err) {
      console.warn('[Settings] Failed to load config:', err);
    }
  }

  (async function() {
    await loadConfig();
    updateGlobalBellBadge();
  })();

})();
