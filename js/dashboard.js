/*
  Admin Dashboard — Marketing & Communications
  Dashboard Charts & Interactivity
  Compatible with Chart.js v2.8.0+
*/

(function () {
  'use strict';

  // Auth Guard
  if (typeof API !== 'undefined') API.requireAuth();

  // =============================================
  // DEFAULT MOCK DATA (Fallback & Initialization)
  // =============================================
  const defaultInquiries = [
    { id: 1, firstName: "Rahul", surname: "Mehta", phone: "9825012345", email: "rahul.mehta@example.com", interestedProject: "7 Days Heights", inquiryType: "Web Inquiry", date: "2026-06-21T09:30:00.000Z" },
    { id: 2, firstName: "Sneha", surname: "Patel", phone: "9012345678", email: "sneha.patel@example.com", interestedProject: "Creation Residency", inquiryType: "Walking Inquiry", date: "2026-06-22T14:15:00.000Z" },
    { id: 3, firstName: "Vikram", surname: "Shah", phone: "8980123456", email: "vikram.shah@example.com", interestedProject: "Signature Tower", inquiryType: "Subscriber", date: "2026-06-23T11:00:00.000Z" },
    { id: 4, firstName: "Neha", surname: "Sharma", phone: "7676767676", email: "neha.sharma@example.com", interestedProject: "Royal Meadows", inquiryType: "Existing Client", date: "2026-06-20T10:45:00.000Z" }
  ];

  const defaultEmailCampaigns = [
    { id: 1, name: "Summer Solstice Special", subject: "Exclusive 10% Off Signature Tower Bookings", audience: "All Inquiries", status: "Sent", date: "2026-06-20T10:00:00.000Z", openRate: "28.4%", clickRate: "5.1%" },
    { id: 2, name: "Weekly Project Digest", subject: "New property listings in Bodakdev", audience: "Subscriber", status: "Sent", date: "2026-06-22T08:30:00.000Z", openRate: "22.1%", clickRate: "3.9%" },
    { id: 3, name: "Followup: Walkin leads", subject: "Thank you for visiting Creation Residency", audience: "Walking Inquiry", status: "Scheduled", date: "2026-06-24T10:00:00.000Z", openRate: "—", clickRate: "—" }
  ];

  const defaultWhatsappCampaigns = [
    { id: 1, name: "VIP Project Launch Invite", template: "VIP Launch", audience: "Existing Client", status: "Sent", date: "2026-06-18T11:00:00.000Z", delivered: "99.4%", read: "89.2%" },
    { id: 2, name: "Site Visit Confirmation Request", template: "Site Visit", audience: "Web Inquiry", status: "Sent", date: "2026-06-21T15:30:00.000Z", delivered: "98.7%", read: "84.5%" }
  ];

  const defaultNotifications = [
    { id: 1, type: "Inquiries", icon: "fa-user-plus", title: "New Web Inquiry Received", desc: "Rajesh Mehta submitted an inquiry for project '7 Days Heights'.", time: new Date(Date.now() - 1000 * 60 * 25).toISOString(), read: false },
    { id: 2, type: "Campaigns", icon: "fa-envelope", title: "Email Campaign Blasted", desc: "Campaign 'Weekly Project Digest' successfully sent to 4,285 subscribers via Resend API.", time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), read: true },
    { id: 3, type: "System", icon: "fa-key", title: "Resend API Key Connected", desc: "Resend email credentials validated successfully.", time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
    { id: 4, type: "Inquiries", icon: "fa-user-plus", title: "New Walking Inquiry Logged", desc: "Sales representative logged Sneha Patel for 'Creation Residency'.", time: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), read: false },
    { id: 5, type: "Campaigns", icon: "fa-comments", title: "WhatsApp Campaign Dispatched", desc: "WhatsApp blast 'Signature Towers VIP Launch' successfully sent to 842 contacts.", time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), read: true }
  ];

  // =============================================
  // LOAD LOCAL STORAGE DATA OR INITIALIZE
  // =============================================
  function getOrInit(key, defaultVal) {
    var stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(stored);
  }

  var inquiries = getOrInit('inquiries', defaultInquiries);
  var emailCampaigns = getOrInit('email_campaigns', defaultEmailCampaigns);
  var whatsappCampaigns = getOrInit('whatsapp_campaigns', defaultWhatsappCampaigns);
  var notifications = getOrInit('notifications', defaultNotifications);

  // =============================================
  // LIVE STATS FROM API (overrides localStorage)
  // =============================================
  async function loadLiveStats() {
    if (typeof API === 'undefined' || !API.session.isLoggedIn()) return;
    try {
      const res = await API.dashboard.stats();
      if (!res || !res.ok) return;
      const { stats, recent } = res.data;

      // Override local data with live data
      if (recent.inquiries.length) {
        inquiries = recent.inquiries.map(r => ({
          id: r.id, firstName: r.first_name, surname: r.surname,
          phone: r.phone, email: r.email || '',
          inquiryType: r.inquiry_type, date: r.created_at
        }));
      }
      if (recent.emailCampaigns.length) {
        emailCampaigns = recent.emailCampaigns.map(r => ({
          id: r.id, name: r.name, subject: r.subject, audience: r.audience,
          status: r.status, openRate: r.open_rate, clickRate: r.click_rate, date: r.sent_at
        }));
      }
      if (recent.waCampaigns.length) {
        whatsappCampaigns = recent.waCampaigns.map(r => ({
          id: r.id, name: r.name, template: r.template_name, audience: r.audience,
          status: r.status, delivered: r.delivered_rate, read: r.read_rate, date: r.sent_at
        }));
      }

      // Patch spotlight counters
      var elInq = document.getElementById('spotlightInquiries');
      var elCamp = document.getElementById('spotlightCampaignsCount');
      var elEmail = document.getElementById('spotlightEmailCount');
      var elWa = document.getElementById('spotlightWhatsappCount');

      if (elInq) { elInq.setAttribute('data-counter', stats.totalInquiries); elInq.textContent = stats.totalInquiries; }
      if (elCamp) { elCamp.setAttribute('data-counter', stats.totalCampaigns); elCamp.textContent = stats.totalCampaigns; }
      if (elEmail) elEmail.textContent = stats.emailCampaignsSent.toLocaleString('en-IN');
      if (elWa) elWa.textContent = stats.waCampaignsSent.toLocaleString('en-IN');

      // Bell badge
      var bellBadges = document.querySelectorAll('.notif-badge');
      bellBadges.forEach(function(badge) {
        if (stats.unreadNotifications > 0) {
          badge.style.display = 'block';
          badge.textContent = stats.unreadNotifications;
        } else { badge.style.display = 'none'; }
      });

      // Update segmentation bars from real breakdown
      if (stats.inquiryBreakdown) {
        var total = stats.totalInquiries || 1;
        var bd = stats.inquiryBreakdown;
        ['General','Walking Inquiry','Architect Reference','Regular Customer'].forEach(function(type, i) {
          var ids = [['progressGeneral','valGeneral'],['progressWalking','valWalking'],['progressArch','valArch'],['progressRegular','valRegular']];
          var cnt = bd[type] || 0;
          var pct = Math.round((cnt / total) * 100);
          var bar = document.getElementById(ids[i] ? ids[i][0] : null);
          var val = document.getElementById(ids[i] ? ids[i][1] : null);
          if (bar) bar.setAttribute('data-width', pct + '%');
          if (val) val.textContent = pct + '%';
        });
      }

      console.log('[Dashboard] Live stats loaded from API:', stats);
    } catch (err) {
      console.warn('[Dashboard] API stats unavailable, using localStorage:', err);
    }
  }
  loadLiveStats();

  // =============================================
  // CALCULATE AND POPULATE STATISTICS
  // =============================================
  
  // 1. Spotlight Sent Outreach
  var emailSentCount = emailCampaigns.filter(function(c) { return c.status === 'Sent'; }).length;
  var waSentCount = whatsappCampaigns.filter(function(c) { return c.status === 'Sent'; }).length;
  
  var totalEmailsSent = 14285 + emailSentCount;
  var totalWaSent = 8412 + waSentCount;

  var elEmailCount = document.getElementById('spotlightEmailCount');
  var elWaCount = document.getElementById('spotlightWhatsappCount');
  if (elEmailCount) elEmailCount.textContent = totalEmailsSent.toLocaleString('en-IN');
  if (elWaCount) elWaCount.textContent = totalWaSent.toLocaleString('en-IN');

  // 2. Spotlight Lead Count, Campaigns, Growth, and Delivery Rate
  var totalCampaigns = emailCampaigns.length + whatsappCampaigns.length;
  
  // Set data-counters
  var elSpotlightInq = document.getElementById('spotlightInquiries');
  var elSpotlightCamp = document.getElementById('spotlightCampaignsCount');
  if (elSpotlightInq) elSpotlightInq.setAttribute('data-counter', inquiries.length);
  if (elSpotlightCamp) elSpotlightCamp.setAttribute('data-counter', totalCampaigns);

  // Growth rates
  var elSpotlightLeadsGrowth = document.getElementById('spotlightLeadsGrowth');
  if (elSpotlightLeadsGrowth) {
    var growthVal = Math.min(25, (inquiries.length * 2.2));
    elSpotlightLeadsGrowth.textContent = '+' + growthVal.toFixed(1) + '%';
  }

  // Delivery rate calculation
  var elSpotlightDeliv = document.getElementById('spotlightDeliveryRate');
  if (elSpotlightDeliv) {
    var sumDeliv = 0;
    var waSentCampaigns = whatsappCampaigns.filter(function(c) { return c.status === 'Sent'; });
    waSentCampaigns.forEach(function(c) {
      var val = parseFloat(c.delivered || '100%');
      sumDeliv += isNaN(val) ? 100 : val;
    });
    var avgDeliv = waSentCampaigns.length > 0 ? (sumDeliv / waSentCampaigns.length) : 99.0;
    elSpotlightDeliv.textContent = avgDeliv.toFixed(1) + '%';
  }

  // 3. Lead Segmentation progress bars
  var webInqs = inquiries.filter(function(x) { return x.inquiryType === 'Web Inquiry'; }).length;
  var walkInqs = inquiries.filter(function(x) { return x.inquiryType === 'Walking Inquiry'; }).length;
  var subInqs = inquiries.filter(function(x) { return x.inquiryType === 'Subscriber'; }).length;
  var clientInqs = inquiries.filter(function(x) { return x.inquiryType === 'Existing Client'; }).length;
  
  var totalInqs = inquiries.length;
  var pctWeb = totalInqs > 0 ? Math.round((webInqs / totalInqs) * 100) : 40;
  var pctWalk = totalInqs > 0 ? Math.round((walkInqs / totalInqs) * 100) : 20;
  var pctSub = totalInqs > 0 ? Math.round((subInqs / totalInqs) * 100) : 25;
  var pctClient = totalInqs > 0 ? Math.round((clientInqs / totalInqs) * 100) : 15;

  var elProgressWeb = document.getElementById('progressWeb');
  var elProgressWalk = document.getElementById('progressWalking');
  var elProgressSub = document.getElementById('progressSubscriber');
  var elProgressClient = document.getElementById('progressClient');
  
  var elValWeb = document.getElementById('valWeb');
  var elValWalk = document.getElementById('valWalking');
  var elValSub = document.getElementById('valSubscriber');
  var elValClient = document.getElementById('valClient');

  if (elProgressWeb && elValWeb) {
    elProgressWeb.setAttribute('data-width', pctWeb + '%');
    elValWeb.textContent = pctWeb + '%';
  }
  if (elProgressWalk && elValWalk) {
    elProgressWalk.setAttribute('data-width', pctWalk + '%');
    elValWalk.textContent = pctWalk + '%';
  }
  if (elProgressSub && elValSub) {
    elProgressSub.setAttribute('data-width', pctSub + '%');
    elValSub.textContent = pctSub + '%';
  }
  if (elProgressClient && elValClient) {
    elProgressClient.setAttribute('data-width', pctClient + '%');
    elValClient.textContent = pctClient + '%';
  }

  // =============================================
  // SIDEBAR ACTIVE STATE
  // =============================================
  var sidebarLinks = document.querySelectorAll('.sidebar-link[data-tooltip]');
  sidebarLinks.forEach(function(link) {
    link.addEventListener('click', function (e) {
      if (this.getAttribute('href') === '#') {
        e.preventDefault();
      }
      sidebarLinks.forEach(function(l) { l.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // =============================================
  // TOP TABS
  // =============================================
  var topTabs = document.querySelectorAll('.top-tab');
  topTabs.forEach(function(tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      topTabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  // =============================================
  // ANIMATED COUNTERS
  // =============================================
  function animateCounter(el, target, duration) {
    duration = duration || 1500;
    var startTime = performance.now();
    var format = el.getAttribute('data-format') || 'number';

    function update(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(target * eased);

      if (format === 'currency') {
        el.textContent = '₹' + current.toLocaleString('en-IN');
      } else {
        el.textContent = current.toLocaleString('en-IN');
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // =============================================
  // CHART.JS v2.8 — SHARED DEFAULTS
  // =============================================
  Chart.defaults.global.defaultFontFamily = "'Inter', -apple-system, sans-serif";
  Chart.defaults.global.defaultFontSize = 11;
  Chart.defaults.global.defaultFontColor = '#a1a1aa';
  Chart.defaults.global.tooltips.backgroundColor = '#000';
  Chart.defaults.global.tooltips.cornerRadius = 8;
  Chart.defaults.global.tooltips.xPadding = 12;
  Chart.defaults.global.tooltips.yPadding = 10;
  Chart.defaults.global.tooltips.titleFontSize = 12;
  Chart.defaults.global.tooltips.bodyFontSize = 12;
  Chart.defaults.global.tooltips.displayColors = false;

  // =============================================
  // 1) INQUIRY VOLUME BAR CHART
  // =============================================
  var activityEl = document.getElementById('activityChart');
  if (activityEl) {
    // Dynamic Inquiry Week calculation (Baseline + user entries in the last 7 days)
    var dayCounts = [12, 15, 14, 20, 18, 8, 6]; // Baseline Mon, Tue, Wed, Thu, Fri, Sat, Sun
    var today = new Date();
    var oneDay = 24 * 60 * 60 * 1000;
    
    inquiries.forEach(function(inq) {
      if (inq.date) {
        var inqDate = new Date(inq.date);
        if (today - inqDate < 7 * oneDay) {
          var dayIndex = inqDate.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6; // Sunday
          dayCounts[dayIndex]++;
        }
      }
    });

    var totalThisWeek = dayCounts.reduce(function(a, b) { return a + b; }, 0);
    var elVolumeNum = document.getElementById('inquiryVolumeNum');
    if (elVolumeNum) {
      elVolumeNum.setAttribute('data-counter', totalThisWeek);
    }
    var elVolumeBadge = document.getElementById('inquiryVolumeBadge');
    if (elVolumeBadge) {
      // Calculate how many were added in the current session/list compared to baseline
      var newLeads = inquiries.filter(function(i) {
        var d = new Date(i.date);
        return today - d < 7 * oneDay;
      }).length;
      elVolumeBadge.textContent = '+' + newLeads + ' new';
    }

    var maxVal = Math.max.apply(null, dayCounts);
    var barColors = dayCounts.map(function(val) {
      return val === maxVal ? '#C7F33C' : '#e5e5e5';
    });

    new Chart(activityEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Inquiries',
          data: dayCounts,
          backgroundColor: barColors,
          hoverBackgroundColor: '#C7F33C',
          barPercentage: 0.55,
          categoryPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          callbacks: {
            label: function(tooltipItem) {
              return tooltipItem.yLabel + ' leads';
            }
          }
        },
        scales: {
          xAxes: [{
            gridLines: { display: false, drawBorder: false },
            ticks: {
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontColor: '#a1a1aa',
              fontStyle: '500'
            }
          }],
          yAxes: [{
            display: false,
            ticks: { beginAtZero: true }
          }]
        }
      }
    });
  }

  // =============================================
  // 2) OUTREACH CHANNELS COMPARISON (Emails vs WhatsApp)
  // =============================================
  var comparisonEl = document.getElementById('comparisonChart');
  if (comparisonEl) {
    var ctx2 = comparisonEl.getContext('2d');

    // Email vs WA Weekly broadcast volume (Baseline + dynamic logs)
    var emailBaseline = [1200, 1450, 1300, 1650, 1500, 800, 950];
    var waBaseline = [750, 900, 850, 1100, 950, 500, 600];
    
    var today = new Date();
    var oneDay = 24 * 60 * 60 * 1000;
    
    emailCampaigns.forEach(function(c) {
      if (c.status === 'Sent' && c.date) {
        var cDate = new Date(c.date);
        if (today - cDate < 7 * oneDay) {
          var dayIndex = cDate.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6;
          
          var size = 1000;
          if (c.audience === 'All Inquiries') size = 4285;
          else if (c.audience === 'Subscriber') size = 1500;
          else if (c.audience === 'Walking Inquiry') size = 400;
          else if (c.audience === 'Existing Client') size = 850;
          
          emailBaseline[dayIndex] += size;
        }
      }
    });

    whatsappCampaigns.forEach(function(c) {
      if (c.status === 'Sent' && c.date) {
        var cDate = new Date(c.date);
        if (today - cDate < 7 * oneDay) {
          var dayIndex = cDate.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6;
          
          var size = 800;
          if (c.audience === 'All Inquiries') size = 3800;
          else if (c.audience === 'Subscriber') size = 1200;
          else if (c.audience === 'Walking Inquiry') size = 350;
          else if (c.audience === 'Existing Client') size = 842;
          
          waBaseline[dayIndex] += size;
        }
      }
    });

    var totalEmails = emailBaseline.reduce(function(a, b) { return a + b; }, 0);
    var totalWa = waBaseline.reduce(function(a, b) { return a + b; }, 0);
    var totalOutreach = totalEmails + totalWa;
    
    var outreachTotalEl = document.getElementById('weeklyOutreachTotal');
    if (outreachTotalEl) {
      outreachTotalEl.innerHTML = (totalOutreach / 1000).toFixed(1) + '<span>K</span>';
    }

    var elOutreachBadge = document.getElementById('outreachBadge');
    if (elOutreachBadge) {
      var difference = totalOutreach - 22700; // Baseline sum is 22,700
      var percentGrowth = difference > 0 ? (difference / 22700 * 100) : 8.4;
      elOutreachBadge.textContent = '+' + percentGrowth.toFixed(1) + '%';
    }

    // Gradient fill for Email line
    var gradientEmail = ctx2.createLinearGradient(0, 0, 0, 200);
    gradientEmail.addColorStop(0, 'rgba(199, 243, 60, 0.15)');
    gradientEmail.addColorStop(1, 'rgba(199, 243, 60, 0)');

    new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Emails',
            data: emailBaseline,
            borderColor: '#C7F33C',
            backgroundColor: gradientEmail,
            borderWidth: 2.5,
            fill: true,
            lineTension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#C7F33C',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          },
          {
            label: 'WhatsApp',
            data: waBaseline,
            borderColor: '#000',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            lineTension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#000',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label;
              return label + ': ' + tooltipItem.yLabel.toLocaleString('en-IN') + ' sent';
            }
          }
        },
        hover: { mode: 'index', intersect: false },
        scales: {
          xAxes: [{
            gridLines: { display: false, drawBorder: false },
            ticks: {
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontColor: '#a1a1aa',
              fontStyle: '500'
            }
          }],
          yAxes: [{
            gridLines: {
              color: 'rgba(0,0,0,0.04)',
              drawBorder: false,
              zeroLineColor: 'rgba(0,0,0,0.04)'
            },
            ticks: {
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontColor: '#a1a1aa',
              fontStyle: '500',
              callback: function(value) {
                return (value / 1000).toFixed(1) + 'K';
              }
            }
          }]
        }
      }
    });
  }

  // =============================================
  // 3) AUDIENCE GROWTH LINE CHART
  // =============================================
  var growthEl = document.getElementById('growthChart');
  if (growthEl) {
    var ctx3 = growthEl.getContext('2d');

    var gradientGrowth = ctx3.createLinearGradient(0, 0, 0, 180);
    gradientGrowth.addColorStop(0, 'rgba(0,0,0,0.05)');
    gradientGrowth.addColorStop(1, 'rgba(0,0,0,0)');

    var baseSubscribers = 8500 + inquiries.length;
    var elAudienceNum = document.getElementById('audienceGrowthNum');
    if (elAudienceNum) {
      elAudienceNum.setAttribute('data-counter', baseSubscribers);
    }
    
    var elAudiencePrev = document.getElementById('audienceGrowthPrev');
    if (elAudiencePrev) {
      elAudiencePrev.textContent = 'Prev: ' + (8500 - 50).toLocaleString();
    }

    new Chart(ctx3, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Subscribers',
          data: [8400, 8420, 8435, 8460, 8480, 8495, baseSubscribers],
          borderColor: '#000',
          backgroundColor: gradientGrowth,
          borderWidth: 2,
          fill: true,
          lineTension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#000',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#C7F33C',
          pointHoverBorderColor: '#000',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          callbacks: {
            label: function(tooltipItem) {
              return tooltipItem.yLabel.toLocaleString('en-IN') + ' subscribers';
            }
          }
        },
        scales: {
          xAxes: [{
            gridLines: { display: false, drawBorder: false },
            ticks: {
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontColor: '#a1a1aa',
              fontStyle: '500'
            }
          }],
          yAxes: [{
            gridLines: {
              color: 'rgba(0,0,0,0.04)',
              drawBorder: false,
              zeroLineColor: 'rgba(0,0,0,0.04)'
            },
            ticks: {
              fontFamily: "'Inter', sans-serif",
              fontSize: 11,
              fontColor: '#a1a1aa',
              fontStyle: '500',
              callback: function(value) {
                return (value / 1000).toFixed(2) + 'K';
              }
            }
          }]
        }
      }
    });
  }

  // =============================================
  // INITIAL RUN: STATS & PROGRESS & COUNTERS
  // =============================================
  
  // Progress Bar Animation
  function animateProgressBars() {
    document.querySelectorAll('.inv-progress-fill').forEach(function(bar) {
      var target = bar.getAttribute('data-width') || '0%';
      setTimeout(function() {
        bar.style.width = target;
      }, 600);
    });
  }
  animateProgressBars();

  // Run counters on page load
  document.querySelectorAll('[data-counter]').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-counter'), 10);
    var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
    setTimeout(function() { animateCounter(el, target, 1500); }, delay);
  });

  // =============================================
  // WIDGET HOVER EFFECT
  // =============================================
  document.querySelectorAll('.widget-card').forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

  // =============================================
  // FEATURED CARD CLOSE
  // =============================================
  var closeBtn = document.querySelector('.featured-card .close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      var card = this.closest('.featured-card');
      card.style.transition = 'all 0.3s ease';
      card.style.transform = 'scale(0.95)';
      card.style.opacity = '0';
      setTimeout(function() {
        card.style.display = 'none';
        var grid = document.querySelector('.dashboard-grid');
        if (grid) {
          grid.style.gridTemplateColumns = '1fr 1.4fr';
        }
      }, 300);
    });
  }

  // =============================================
  // DATE RANGE
  // =============================================
  var todayDate = new Date();
  var dateStartEl = document.getElementById('dateStart');
  var dateEndEl = document.getElementById('dateEnd');

  if (dateStartEl) {
    var start = new Date(todayDate);
    start.setDate(start.getDate() - 7);
    dateStartEl.textContent = formatDate(start);
  }
  if (dateEndEl) {
    dateEndEl.textContent = formatDate(todayDate);
  }

  function formatDate(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
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
      if (typeof API !== 'undefined') {
        await API.auth.logout();
      } else {
        alert('Logging out...');
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
  // UNREAD NOTIFICATIONS SYNC
  // =============================================
  function updateGlobalBellBadge() {
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

  // Storage synchronization listener
  window.addEventListener('storage', function(e) {
    if (e.key === 'inquiries' || e.key === 'email_campaigns' || e.key === 'whatsapp_campaigns' || e.key === 'notifications') {
      window.location.reload(); // Reload to refresh datasets & animations cleanly
    }
  });

})();
