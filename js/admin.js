/*
  Admin Dashboard — Area Square Feet
  Login & 2-Step Authentication JavaScript
  Version: 1.0
*/

(function () {
  'use strict';

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const loginStep = document.getElementById('loginStep');
  const verifyStep = document.getElementById('verifyStep');
  const totpStep = document.getElementById('totpStep');
  const successStep = document.getElementById('successStep');

  const loginForm = document.getElementById('loginForm');
  const verifyForm = document.getElementById('verifyForm');
  const totpForm = document.getElementById('totpForm');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');

  const loginBtn = document.getElementById('loginBtn');
  const verifyBtn = document.getElementById('verifyBtn');
  const backToLoginBtn = document.getElementById('backToLogin');
  const resendBtn = document.getElementById('resendBtn');
  const resendTimer = document.getElementById('resendTimer');
  const maskedEmail = document.getElementById('maskedEmail');

  const totpCode = document.getElementById('totpCode');
  const totpVerifyBtn = document.getElementById('totpVerifyBtn');
  const backToOtpBtn = document.getElementById('backToOtp');

  const passwordStrength = document.getElementById('passwordStrength');
  const otpContainer = document.getElementById('otpContainer');
  const otpInputs = document.querySelectorAll('.otp-input');

  let resendInterval = null;
  let turnstileToken = null;
  let toastContainer = null;


  // =============================================
  // TOAST NOTIFICATION SYSTEM
  // =============================================
  function createToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type = 'success', duration = 4000) {
    const container = createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: 'fas fa-check',
      error: 'fas fa-xmark',
      warning: 'fas fa-exclamation'
    };

    toast.innerHTML = `
      <div class="toast-icon"><i class="${iconMap[type] || iconMap.success}"></i></div>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }


  // =============================================
  // STEP NAVIGATION
  // =============================================
  function showStep(step) {
    const steps = [loginStep, verifyStep, totpStep, successStep];
    steps.forEach(s => {
      if (s) {
        s.classList.remove('active');
      }
    });
    if (step) {
      // Slight delay for animation retrigger
      requestAnimationFrame(() => {
        step.classList.add('active');
      });
    }
  }


  // =============================================
  // EMAIL MASKING
  // =============================================
  function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    const visible = local.substring(0, 2);
    const masked = '•'.repeat(Math.min(local.length - 2, 6));
    return `${visible}${masked}@${domain}`;
  }


  // =============================================
  // PASSWORD VISIBILITY TOGGLE
  // =============================================
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      const icon = this.querySelector('i');
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  }


  // =============================================
  // PASSWORD STRENGTH INDICATOR
  // =============================================
  if (passwordInput && passwordStrength) {
    passwordInput.addEventListener('input', function () {
      const value = this.value;
      const fill = passwordStrength.querySelector('.strength-fill');
      const text = passwordStrength.querySelector('.strength-text');

      if (value.length === 0) {
        passwordStrength.classList.remove('visible');
        return;
      }

      passwordStrength.classList.add('visible');

      // Calculate strength
      let score = 0;
      if (value.length >= 6) score++;
      if (value.length >= 10) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;

      // Remove all classes
      fill.className = 'strength-fill';
      text.className = 'strength-text';

      if (score <= 2) {
        fill.classList.add('weak');
        text.classList.add('weak');
        text.textContent = 'Weak';
      } else if (score <= 3) {
        fill.classList.add('medium');
        text.classList.add('medium');
        text.textContent = 'Medium';
      } else {
        fill.classList.add('strong');
        text.classList.add('strong');
        text.textContent = 'Strong';
      }
    });
  }


  // =============================================
  // INPUT VALIDATION HELPERS
  // =============================================
  function setInputError(input, message) {
    const wrapper = input.closest('.input-wrapper') || input.parentElement;
    input.classList.add('error');
    input.classList.remove('success');

    // Remove existing error
    const existingError = wrapper.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();

    if (message) {
      const errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${message}`;
      wrapper.parentElement.appendChild(errorEl);
    }
  }

  function clearInputError(input) {
    const wrapper = input.closest('.input-wrapper') || input.parentElement;
    input.classList.remove('error');

    const existingError = wrapper.parentElement.querySelector('.error-message');
    if (existingError) existingError.remove();
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }


  // =============================================
  // LOGIN FORM SUBMISSION
  // =============================================
  if (loginForm) {
    // Clear errors on input
    if (emailInput) emailInput.addEventListener('input', () => clearInputError(emailInput));
    if (passwordInput) passwordInput.addEventListener('input', () => clearInputError(passwordInput));

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = emailInput ? emailInput.value.trim() : '';
      let hasError = false;

      // Validate email
      if (!email) {
        setInputError(emailInput, 'Email address is required');
        hasError = true;
      } else if (!validateEmail(email)) {
        setInputError(emailInput, 'Please enter a valid email address');
        hasError = true;
      }

      // Validate Turnstile
      const turnstileContainer = document.getElementById('turnstileContainer');
      if (turnstileContainer && turnstileContainer.style.display !== 'none' && !turnstileToken) {
        setInputError(emailInput, 'Please complete the Captcha verification.');
        return;
      }

      if (hasError) return;

      // Store email for OTP step
      window._loginEmail = email;

      // Show loading state
      loginBtn.classList.add('loading');
      loginBtn.disabled = true;

      // ── REAL API CALL: Send OTP via Worker → Resend ──────────
      try {
        const res = await API.auth.sendOTP(email, turnstileToken);
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;

        if (!res || !res.ok) {
          const errMsg = res?.data?.error || 'This email is not authorized to access the portal.';
          setInputError(emailInput, errMsg);
          return;
        }

        // Set masked email for 2FA step
        if (maskedEmail) {
          maskedEmail.textContent = res.data.masked || maskEmail(email);
        }

        // Show dev OTP hint in console if available
        if (res.data.dev_otp) {
          console.log('%c[DEV] OTP Code: ' + res.data.dev_otp, 'background:#111;color:#0f0;font-size:16px;padding:4px 8px;border-radius:4px;');
        }

        showToast('OTP sent to your email. Please check your inbox.', 'success');
        showStep(verifyStep);
        startResendTimer();

        setTimeout(() => {
          const firstOtp = otpInputs[0];
          if (firstOtp) firstOtp.focus();
        }, 400);

      } catch (err) {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        setInputError(emailInput, 'Connection error. Make sure the API server is running.');
      }
    });
  }


  // =============================================
  // OTP INPUT HANDLING
  // =============================================
  if (otpInputs.length > 0) {
    otpInputs.forEach((input, index) => {
      // Only allow numbers
      input.addEventListener('input', function (e) {
        const value = this.value.replace(/[^0-9]/g, '');
        this.value = value;

        if (value) {
          this.classList.add('filled');
          // Auto-focus next input
          if (index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        } else {
          this.classList.remove('filled');
        }

        // Check if all filled
        checkOtpComplete();
      });

      // Handle backspace
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace') {
          if (!this.value && index > 0) {
            otpInputs[index - 1].focus();
            otpInputs[index - 1].value = '';
            otpInputs[index - 1].classList.remove('filled');
          } else {
            this.classList.remove('filled');
          }
        }

        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
          e.preventDefault();
          otpInputs[index - 1].focus();
        }
        if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
          e.preventDefault();
          otpInputs[index + 1].focus();
        }
      });

      // Handle paste
      input.addEventListener('paste', function (e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');

        if (pastedData.length > 0) {
          const digits = pastedData.split('').slice(0, otpInputs.length);
          digits.forEach((digit, i) => {
            if (otpInputs[i]) {
              otpInputs[i].value = digit;
              otpInputs[i].classList.add('filled');
            }
          });

          // Focus the next empty input or the last one
          const nextEmpty = Array.from(otpInputs).findIndex(inp => !inp.value);
          if (nextEmpty !== -1) {
            otpInputs[nextEmpty].focus();
          } else {
            otpInputs[otpInputs.length - 1].focus();
          }

          checkOtpComplete();
        }
      });

      // Handle focus
      input.addEventListener('focus', function () {
        this.select();
      });
    });
  }

  function checkOtpComplete() {
    const allFilled = Array.from(otpInputs).every(inp => inp.value.length === 1);
    if (allFilled && verifyBtn) {
      verifyBtn.style.opacity = '1';
    }
  }

  function getOtpValue() {
    return Array.from(otpInputs).map(inp => inp.value).join('');
  }

  function clearOtp() {
    otpInputs.forEach(inp => {
      inp.value = '';
      inp.classList.remove('filled', 'error');
    });
  }


  // =============================================
  // VERIFY FORM SUBMISSION
  // =============================================
  if (verifyForm) {
    verifyForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const otp = getOtpValue();
      const email = window._loginEmail || '';

      if (otp.length < 6) {
        otpInputs.forEach(inp => {
          if (!inp.value) inp.classList.add('error');
        });
        showToast('Please enter the complete 6-digit code', 'error');
        return;
      }

      if (!email) {
        showToast('Session lost. Please start again.', 'error');
        showStep(loginStep);
        return;
      }

      // Show loading state
      verifyBtn.classList.add('loading');
      verifyBtn.disabled = true;

      // ── REAL API CALL: Verify OTP → Get Session Token ────────
      try {
        const res = await API.auth.verifyOTP(email, otp);
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;

        if (!res || !res.ok) {
          otpInputs.forEach(inp => inp.classList.add('error'));
          showToast(res?.data?.error || 'Invalid OTP. Please try again.', 'error');
          clearOtp();
          if (otpInputs[0]) otpInputs[0].focus();
          return;
        }

        if (res.data.require2FA) {
          window._temp2faToken = res.data.tempToken;
          showToast('OTP verified. Please enter your Authenticator code.', 'success');
          showStep(totpStep);
          if (totpCode) {
            totpCode.value = '';
            setTimeout(() => totpCode.focus(), 400);
          }
          return;
        }

        // ── Store session token ──────────────────────────────────
        API.session.setToken(res.data.token, res.data.user, true);

        showToast('Verification successful! Redirecting...', 'success');
        showStep(successStep);

        if (resendInterval) clearInterval(resendInterval);

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2500);

      } catch (err) {
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;
        showToast('Connection error. Make sure the API server is running.', 'error');
      }
    });
  }


  // =============================================
  // GOOGLE AUTHENTICATOR (TOTP) SUBMISSION
  // =============================================
  if (totpForm) {
    totpForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const code = totpCode ? totpCode.value.replace(/\s+/g, '') : '';
      const tempToken = window._temp2faToken || '';

      if (!code || code.length < 6) {
        showToast('Please enter a valid 6-digit code.', 'error');
        if (totpCode) totpCode.classList.add('error');
        return;
      }

      if (!tempToken) {
        showToast('Session expired. Please request a new OTP.', 'error');
        showStep(loginStep);
        return;
      }

      // Show loading state
      totpVerifyBtn.classList.add('loading');
      totpVerifyBtn.disabled = true;

      try {
        const res = await API.auth.twoFA.verify(tempToken, code);
        totpVerifyBtn.classList.remove('loading');
        totpVerifyBtn.disabled = false;

        if (!res || !res.ok) {
          if (totpCode) {
            totpCode.classList.add('error');
            totpCode.value = '';
            totpCode.focus();
          }
          showToast(res?.data?.error || 'Invalid authenticator code. Please try again.', 'error');
          return;
        }

        // ── Store final session token ────────────────────────────
        API.session.setToken(res.data.token, res.data.user, true);

        showToast('2FA Verification successful! Redirecting...', 'success');
        showStep(successStep);

        if (resendInterval) clearInterval(resendInterval);

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 2500);

      } catch (err) {
        totpVerifyBtn.classList.remove('loading');
        totpVerifyBtn.disabled = false;
        showToast('Connection error. Make sure the API server is running.', 'error');
      }
    });

    if (totpCode) {
      totpCode.addEventListener('input', function () {
        this.classList.remove('error');
      });
    }
  }

  // Back to OTP from TOTP step
  if (backToOtpBtn) {
    backToOtpBtn.addEventListener('click', function () {
      showStep(verifyStep);
    });
  }


  // =============================================
  // BACK TO LOGIN
  // =============================================
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function () {
      showStep(loginStep);
      clearOtp();

      // Clear timer
      if (resendInterval) {
        clearInterval(resendInterval);
      }
    });
  }


  // =============================================
  // RESEND TIMER
  // =============================================
  function startResendTimer() {
    let seconds = 30;

    if (resendBtn) resendBtn.disabled = true;
    if (resendTimer) resendTimer.textContent = `(${seconds}s)`;

    if (resendInterval) clearInterval(resendInterval);

    resendInterval = setInterval(() => {
      seconds--;
      if (resendTimer) resendTimer.textContent = `(${seconds}s)`;

      if (seconds <= 0) {
        clearInterval(resendInterval);
        if (resendBtn) resendBtn.disabled = false;
        if (resendTimer) resendTimer.textContent = '';
      }
    }, 1000);
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async function () {
      if (this.disabled) return;

      const email = window._loginEmail || '';
      if (!email) { showToast('Session lost. Please start again.', 'error'); showStep(loginStep); return; }

      clearOtp();
      startResendTimer();

      // ── REAL API CALL: Resend OTP ─────────────────────────────
      const res = await API.auth.sendOTP(email);
      if (res && res.ok) {
        if (res.data.dev_otp) {
          console.log('%c[DEV] Resent OTP: ' + res.data.dev_otp, 'background:#111;color:#0f0;font-size:16px;padding:4px 8px;border-radius:4px;');
        }
        showToast('New OTP sent to your email.', 'success');
      } else {
        showToast('Failed to resend OTP. Please try again.', 'error');
      }

      setTimeout(() => {
        if (otpInputs[0]) otpInputs[0].focus();
      }, 100);
    });
  }


  // =============================================
  // FORM INPUT ANIMATIONS — FLOATING LABELS
  // =============================================
  document.querySelectorAll('.input-wrapper input').forEach(input => {
    input.addEventListener('focus', function () {
      this.closest('.input-wrapper').classList.add('focused');
    });

    input.addEventListener('blur', function () {
      this.closest('.input-wrapper').classList.remove('focused');
    });
  });


  // =============================================
  // INITIAL ANIMATIONS
  // =============================================
  function initAnimations() {
    // Add entrance animation delay to branding elements
    const brandingElements = document.querySelectorAll('.branding-inner > *');
    brandingElements.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.1}s`;
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }


  // =============================================
  // KEYBOARD SHORTCUTS
  // =============================================
  document.addEventListener('keydown', function (e) {
    // ESC to go back from verify step
    if (e.key === 'Escape' && verifyStep && verifyStep.classList.contains('active')) {
      if (backToLoginBtn) backToLoginBtn.click();
    }

    // Enter on OTP inputs triggers submit
    if (e.key === 'Enter' && verifyStep && verifyStep.classList.contains('active')) {
      const otp = getOtpValue();
      if (otp.length === 6 && verifyForm) {
        verifyForm.dispatchEvent(new Event('submit'));
      }
    }
  });


  // =============================================
  // PREVENT DOUBLE SUBMISSION
  // =============================================
  let formSubmitting = false;

  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function () {
      if (formSubmitting) return false;
      formSubmitting = true;
      setTimeout(() => { formSubmitting = false; }, 3000);
    });
  });

  // =============================================
  // CLOUDFLARE TURNSTILE CAPTCHA INITIALIZATION
  // =============================================
  async function checkTurnstileConfig() {
    try {
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
