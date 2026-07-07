/**
 * Profile Page JavaScript
 * Handles all interactivity for the admin profile page.
 * Follows the same patterns as settings.js.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Auth Guard
  if (typeof API !== 'undefined') API.requireAuth();

  /* ──────────────────────────────────────────────
     1. Mobile Sidebar Toggle
     ────────────────────────────────────────────── */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  }

  /* ──────────────────────────────────────────────
     2. Profile Dropdown
     ────────────────────────────────────────────── */
  const profileBtn = document.getElementById('topProfileBtn');
  const profileContainer = profileBtn?.closest('.profile-dropdown-container');

  if (profileBtn && profileContainer) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileContainer.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }

  /* ──────────────────────────────────────────────
     3. Save Toast
     ────────────────────────────────────────────── */
  function showToast(message) {
    const toast = document.getElementById('saveToast');
    if (!toast) return;

    toast.innerHTML =
      '<i class="fas fa-check-circle"></i> ' +
      (message || 'Changes saved successfully');

    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* ──────────────────────────────────────────────
     4. Toggle Switches
     ────────────────────────────────────────────── */
  document.querySelectorAll('.toggle-input').forEach((toggle) => {
    toggle.addEventListener('change', () => {
      showToast('Setting updated');
    });
  });

  /* ──────────────────────────────────────────────
     5. Save Buttons & Dynamic UI Updates
     ────────────────────────────────────────────── */
  const saveBtn = document.getElementById('savePersonalInfo');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const firstName = document.getElementById('firstName')?.value.trim() || 'Dhruv';
      const lastName = document.getElementById('lastName')?.value.trim() || 'Patel';
      const emailAddress = document.getElementById('emailAddress')?.value.trim() || 'dhruv@areasqft.com';
      const designation = document.getElementById('designation')?.value.trim() || 'Lead Developer';

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';

      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
        
        // Update Hero Card details
        const heroName = document.querySelector('.hero-name');
        if (heroName) heroName.textContent = firstName + ' ' + lastName;
        
        const heroEmail = document.querySelector('.hero-email');
        if (heroEmail) heroEmail.innerHTML = '<i class="fas fa-envelope"></i> ' + emailAddress;
        
        // Update Top Navigation details
        const dropdownName = document.querySelector('.dropdown-user-details strong');
        if (dropdownName) dropdownName.textContent = firstName + ' ' + lastName;
        
        const dropdownEmail = document.querySelector('.dropdown-user-details span');
        if (dropdownEmail) dropdownEmail.textContent = emailAddress;

        showToast('Changes saved successfully');
      }, 1200);
    });
  }

  /* ──────────────────────────────────────────────
     6. Change Password Toggle
     ────────────────────────────────────────────── */
  const changePwdBtn = document.getElementById('changePasswordBtn');

  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      const pwdSection = document.getElementById('passwordChangeSection');
      if (pwdSection) {
        pwdSection.style.display =
          pwdSection.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  /* ──────────────────────────────────────────────
     7. Edit Profile — Scroll to Personal Info
     ────────────────────────────────────────────── */
  const editProfileBtn = document.getElementById('editProfileBtn');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      const personalInfo = document.getElementById('personalInfoCard');
      if (personalInfo) {
        personalInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Focus the first input after the scroll finishes
        setTimeout(() => {
          const firstInput = personalInfo.querySelector('.form-input');
          if (firstInput) firstInput.focus();
        }, 500);
      }
    });
  }

  /* ──────────────────────────────────────────────
     8. Danger Zone — Deactivate & Delete Account
     ────────────────────────────────────────────── */
  document.getElementById('deactivateAccountBtn')?.addEventListener('click', () => {
    if (
      confirm(
        'Are you sure you want to deactivate your account? You can reactivate it later.'
      )
    ) {
      showToast('Account deactivated');
    }
  });

  document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
    const confirmed = prompt('Type DELETE to permanently delete your account:');
    if (confirmed === 'DELETE') {
      showToast('Account deletion initiated');
    }
  });

  /* ──────────────────────────────────────────────
     9. Manage Sessions
     ────────────────────────────────────────────── */
  document.getElementById('manageSessionsBtn')?.addEventListener('click', () => {
    showToast('Session management coming soon');
  });

  /* ──────────────────────────────────────────────
     10. Avatar Change Interactivity
     ────────────────────────────────────────────── */
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const heroAvatar = document.getElementById('heroAvatar');
  const topProfileBtn = document.getElementById('topProfileBtn');
  const dropdownAvatar = document.querySelector('.dropdown-avatar');

  if (changeAvatarBtn && avatarFileInput) {
    changeAvatarBtn.addEventListener('click', () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          showToast('Please select an image file');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;

          // Update Hero Avatar
          if (heroAvatar) {
            heroAvatar.style.backgroundImage = `url(${imageUrl})`;
            heroAvatar.style.backgroundSize = 'cover';
            heroAvatar.style.backgroundPosition = 'center';
            // Hide the default user icon inside it if there is one
            const icon = heroAvatar.querySelector('i');
            if (icon) icon.style.display = 'none';
            // Clear any text initials if they were there
            heroAvatar.textContent = '';
          }

          // Update Top Profile Icon
          if (topProfileBtn) {
            topProfileBtn.style.backgroundImage = `url(${imageUrl})`;
            topProfileBtn.style.backgroundSize = 'cover';
            topProfileBtn.style.backgroundPosition = 'center';
          }

          // Update Dropdown Avatar Icon
          if (dropdownAvatar) {
            dropdownAvatar.style.backgroundImage = `url(${imageUrl})`;
            dropdownAvatar.style.backgroundSize = 'cover';
            dropdownAvatar.style.backgroundPosition = 'center';
          }

          showToast('Profile avatar updated successfully');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /* ──────────────────────────────────────────────
     11. Logout Simulator
     ────────────────────────────────────────────── */
  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showToast('Logging out...');
      if (typeof API !== 'undefined') {
        await API.auth.logout();
      } else {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    });
  }

  /* ──────────────────────────────────────────────
     12. Notification Badge Sync
     ────────────────────────────────────────────── */
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
  updateGlobalBellBadge();

  window.addEventListener('storage', function (e) {
    if (e.key === 'notifications') {
      updateGlobalBellBadge();
    }
  });

}); // end DOMContentLoaded
