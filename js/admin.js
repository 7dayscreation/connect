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
  const successStep = document.getElementById('successStep');

  const loginForm = document.getElementById('loginForm');
  const verifyForm = document.getElementById('verifyForm');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('togglePassword');

  const loginBtn = document.getElementById('loginBtn');
  const verifyBtn = document.getElementById('verifyBtn');
  const backToLoginBtn = document.getElementById('backToLogin');
  const resendBtn = document.getElementById('resendBtn');
  const resendTimer = document.getElementById('resendTimer');
  const maskedEmail = document.getElementById('maskedEmail');

  const passwordStrength = document.getElementById('passwordStrength');
  const otpContainer = document.getElementById('otpContainer');
  const otpInputs = document.querySelectorAll('.otp-input');

  let resendInterval = null;
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
    const steps = [loginStep, verifyStep, successStep];
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
    emailInput.addEventListener('input', () => clearInputError(emailInput));
    passwordInput.addEventListener('input', () => clearInputError(passwordInput));

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      let hasError = false;

      // Validate email
      if (!email) {
        setInputError(emailInput, 'Email address is required');
        hasError = true;
      } else if (!validateEmail(email)) {
        setInputError(emailInput, 'Please enter a valid email address');
        hasError = true;
      }

      // Validate password
      if (!password) {
        setInputError(passwordInput, 'Password is required');
        hasError = true;
      } else if (password.length < 6) {
        setInputError(passwordInput, 'Password must be at least 6 characters');
        hasError = true;
      }

      if (hasError) return;

      // Show loading state
      loginBtn.classList.add('loading');

      // Simulate API call
      setTimeout(() => {
        loginBtn.classList.remove('loading');

        // Set masked email for 2FA step
        if (maskedEmail) {
          maskedEmail.textContent = maskEmail(email);
        }

        // Show success toast
        showToast('Credentials verified! Please complete 2-step verification.', 'success');

        // Transition to 2FA step
        showStep(verifyStep);

        // Start resend timer
        startResendTimer();

        // Focus first OTP input
        setTimeout(() => {
          const firstOtp = otpInputs[0];
          if (firstOtp) firstOtp.focus();
        }, 400);

      }, 1500);
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
    verifyForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const otp = getOtpValue();

      if (otp.length < 6) {
        // Highlight empty inputs
        otpInputs.forEach(inp => {
          if (!inp.value) inp.classList.add('error');
        });
        showToast('Please enter the complete 6-digit code', 'error');
        return;
      }

      // Show loading state
      verifyBtn.classList.add('loading');

      // Simulate verification
      setTimeout(() => {
        verifyBtn.classList.remove('loading');

        // For demo, accept any 6-digit code
        // In production, validate against server
        showToast('Verification successful!', 'success');

        // Show success step
        showStep(successStep);

        // Clear timer
        if (resendInterval) {
          clearInterval(resendInterval);
        }

        // Simulate redirect after success animation
        setTimeout(() => {
          window.location.href = 'dashboard.html';
          showToast('Redirecting to dashboard...', 'success');
        }, 3000);

      }, 2000);
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
    resendBtn.addEventListener('click', function () {
      if (this.disabled) return;

      clearOtp();
      startResendTimer();
      showToast('Verification code resent to your email', 'success');

      // Focus first input
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

})();
