/*
  Sales Inquiry Form — 7 Days Creation
  Validation & LocalStorage Persistence
*/

(function () {
  'use strict';

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const form = document.getElementById('inquiryForm');
  const successState = document.getElementById('successState');
  const submitBtn = document.getElementById('submitBtn');
  const addAnotherBtn = document.getElementById('addAnotherBtn');

  // Input fields
  const firstName = document.getElementById('firstName');
  const surname = document.getElementById('surname');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const inquiryType = document.getElementById('inquiryType');

  let turnstileToken = null;

  // =============================================
  // TOAST NOTIFICATIONS
  // =============================================
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // =============================================
  // MOCK DATA INITIALIZATION
  // =============================================
  const defaultInquiries = [
    { id: 1, firstName: "Rahul", surname: "Mehta", phone: "9825012345", email: "rahul.mehta@example.com", interestedProject: "7 Days Heights", inquiryType: "Web Inquiry", date: "2026-06-21T09:30:00.000Z" },
    { id: 2, firstName: "Sneha", surname: "Patel", phone: "9012345678", email: "sneha.patel@example.com", interestedProject: "Creation Residency", inquiryType: "Walking Inquiry", date: "2026-06-22T14:15:00.000Z" },
    { id: 3, firstName: "Vikram", surname: "Shah", phone: "8980123456", email: "vikram.shah@example.com", interestedProject: "Signature Tower", inquiryType: "Subscriber", date: "2026-06-23T11:00:00.000Z" },
    { id: 4, firstName: "Neha", surname: "Sharma", phone: "7676767676", email: "neha.sharma@example.com", interestedProject: "Royal Meadows", inquiryType: "Existing Client", date: "2026-06-20T10:45:00.000Z" }
  ];

  function getInquiries() {
    const data = localStorage.getItem('inquiries');
    if (!data) {
      localStorage.setItem('inquiries', JSON.stringify(defaultInquiries));
      return defaultInquiries;
    }
    return JSON.parse(data);
  }

  function saveInquiry(inquiry) {
    const list = getInquiries();
    inquiry.id = Date.now();
    inquiry.date = new Date().toISOString();
    list.unshift(inquiry);
    localStorage.setItem('inquiries', JSON.stringify(list));

    // Append to notification list
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotif = {
      id: Date.now(),
      type: "Inquiries",
      icon: "fa-user-plus",
      title: "New Sales Inquiry Received",
      desc: `${inquiry.firstName} ${inquiry.surname} submitted a sales inquiry for segment '${inquiry.inquiryType}'.`,
      time: new Date().toISOString(),
      read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem('notifications', JSON.stringify(notifs));
  }

  // Initialize inquiries on load if they don't exist
  getInquiries();

  // =============================================
  // VALIDATION HELPERS
  // =============================================
  function setError(input, message) {
    const wrapper = input.parentElement;
    wrapper.classList.add('error');
    
    // Remove existing error hint if any
    const existingHint = wrapper.parentElement.querySelector('.error-hint');
    if (existingHint) existingHint.remove();

    const hint = document.createElement('div');
    hint.className = 'error-hint';
    hint.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${message}`;
    wrapper.parentElement.appendChild(hint);
  }

  function clearError(input) {
    const wrapper = input.parentElement;
    wrapper.classList.remove('error');
    const hint = wrapper.parentElement.querySelector('.error-hint');
    if (hint) hint.remove();
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function validatePhone(val) {
    return /^\+?[0-9\s\-]{8,15}$/.test(val);
  }

  // Clear errors on input
  [firstName, surname, phone, email, inquiryType].forEach(input => {
    input.addEventListener('input', () => clearError(input));
    input.addEventListener('change', () => clearError(input));
  });

  // =============================================
  // SUBMISSION LOGIC (Real API)
  // =============================================
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    let hasError = false;

    // Validate fields
    if (!firstName.value.trim()) {
      setError(firstName, 'First Name is required');
      hasError = true;
    }
    
    if (!surname.value.trim()) {
      setError(surname, 'Surname is required');
      hasError = true;
    }

    const phoneVal = phone.value.trim();
    if (!phoneVal) {
      setError(phone, 'Phone number is required');
      hasError = true;
    } else if (!validatePhone(phoneVal)) {
      setError(phone, 'Enter a valid phone number');
      hasError = true;
    }

    const emailVal = email.value.trim();
    if (emailVal && !validateEmail(emailVal)) {
      setError(email, 'Enter a valid email address');
      hasError = true;
    }

    if (!inquiryType.value) {
      setError(inquiryType, 'Please select segment / source');
      hasError = true;
    }

    // Turnstile Check
    const turnstileContainer = document.getElementById('turnstileContainer');
    if (turnstileContainer && turnstileContainer.style.display !== 'none' && !turnstileToken) {
      showToast('Please complete the Captcha verification.', 'error');
      return;
    }

    if (hasError) {
      showToast('Please correct the highlighted errors.', 'error');
      return;
    }

    // Submit state loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const newInquiry = {
      firstName: firstName.value.trim(),
      surname: surname.value.trim(),
      phone: phoneVal,
      email: emailVal || null,
      inquiryType: inquiryType.value,
      turnstileToken: turnstileToken
    };

    // ── REAL API CALL ──────────────────────────────────────────
    try {
      // Try the Cloudflare Worker API first
      let saved = false;

      if (typeof API !== 'undefined') {
        const res = await API.inquiries.create(newInquiry);
        if (res && res.ok) {
          saved = true;
        } else {
          console.warn('[Inquiry] API error, falling back to localStorage:', res?.data?.error);
        }
      }

      // Fallback: localStorage (if API not available)
      if (!saved) {
        const list = JSON.parse(localStorage.getItem('inquiries') || '[]');
        const localEntry = { ...newInquiry, id: Date.now(), date: new Date().toISOString() };
        list.unshift(localEntry);
        localStorage.setItem('inquiries', JSON.stringify(list));
        const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
        notifs.unshift({ id: Date.now(), type: 'Inquiries', icon: 'fa-user-plus', title: 'New Inquiry (Local)', desc: `${newInquiry.firstName} ${newInquiry.surname} - ${newInquiry.inquiryType}`, time: new Date().toISOString(), read: false });
        localStorage.setItem('notifications', JSON.stringify(notifs));
      }

      // Trigger success view
      form.style.display = 'none';
      successState.style.display = 'flex';
      showToast('Inquiry successfully recorded!');

    } catch (err) {
      console.error('[Inquiry Submit Error]', err);
      showToast('Failed to save inquiry. Please try again.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // Log Another Action
  addAnotherBtn.addEventListener('click', function () {
    form.reset();
    form.style.display = 'flex';
    successState.style.display = 'none';
    
    // Focus first input
    setTimeout(() => firstName.focus(), 100);
  });

  // =============================================
  // CLOUDFLARE TURNSTILE CAPTCHA INITIALIZATION
  // =============================================
  async function checkTurnstileConfig() {
    try {
      if (typeof API === 'undefined') return;
      const res = await API.auth.branding();
      if (res && res.ok && res.data.data) {
        const brand = res.data.data;
        if (brand.turnstileEnabled) {
          const container = document.getElementById('turnstileContainer');
          if (container) {
            container.style.display = 'flex';
            
            // Load script dynamically if not already loaded
            if (!window.turnstile) {
              const script = document.createElement('script');
              script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
              script.async = true;
              script.defer = true;
              document.head.appendChild(script);
              
              window.onloadTurnstileCallback = function () {
                turnstile.render('#turnstileContainer', {
                  sitekey: brand.turnstileSiteKey,
                  theme: brand.turnstileTheme || 'light',
                  callback: function (token) {
                    turnstileToken = token;
                  }
                });
              };
            } else {
              turnstile.render('#turnstileContainer', {
                sitekey: brand.turnstileSiteKey,
                theme: brand.turnstileTheme || 'light',
                callback: function (token) {
                  turnstileToken = token;
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Turnstile] Failed to initialize Turnstile:', e);
    }
  }

  // Run on load
  checkTurnstileConfig();

})();
