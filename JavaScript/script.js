/* ==========================================================================
   ARCHIE VELILE SENIOR SECONDARY SCHOOL — SITE SCRIPT
   Modular vanilla JS: nav, scroll reveals, accordion, resource filtering
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initMobileNav();
  initActiveNav();
  initScrollReveal();
  initAccordion();
  initResourceFilter();
  initContactForm();
  initFacultyExpand();
  initAdmissionsApplication();
});

/* --- Mobile navigation toggle --- */
function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });

  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      toggle.focus();
    }
  });
}

/* --- Highlight current page in nav --- */
function initActiveNav() {
  var current = (document.body.getAttribute('data-page') || '').trim();
  if (!current) return;
  document.querySelectorAll('.main-nav a').forEach(function (link) {
    if (link.getAttribute('data-nav') === current) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* --- Scroll-triggered reveal animations --- */
function initScrollReveal() {
  var targets = document.querySelectorAll('.reveal, .reveal-scale');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function (el, i) {
    el.style.setProperty('--i', i % 6);
    observer.observe(el);
  });
}

/* --- FAQ accordion (Admissions page) --- */
function initAccordion() {
  var triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (!panel) return;
      if (expanded) {
        panel.style.maxHeight = '0px';
      } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* --- Resource Centre filtering --- */
function initResourceFilter() {
  var tabs = document.querySelectorAll('.filter-tab');
  var cards = document.querySelectorAll('[data-resource-category]');
  if (!tabs.length || !cards.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
      tab.setAttribute('aria-pressed', 'true');
      var category = tab.getAttribute('data-filter');

      cards.forEach(function (card) {
        var match = category === 'all' || card.getAttribute('data-resource-category') === category;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

/* --- Faculty Profile "Read Full Message" expand interaction --- */
function initFacultyExpand() {
  var toggles = document.querySelectorAll('.faculty-expand-toggle');
  if (!toggles.length) return;

  toggles.forEach(function (toggle) {
    var panel = document.getElementById(toggle.getAttribute('aria-controls'));
    var labelEl = toggle.querySelector('.label');
    if (!panel) return;

    toggle.addEventListener('click', function () {
      var expanded = toggle.getAttribute('aria-expanded') === 'true';

      if (expanded) {
        // Collapse
        panel.style.maxHeight = panel.scrollHeight + 'px';
        requestAnimationFrame(function () {
          panel.style.maxHeight = '0px';
          panel.classList.remove('is-open');
        });
        toggle.setAttribute('aria-expanded', 'false');
        if (labelEl) labelEl.textContent = 'Read Full Message';
      } else {
        // Expand
        panel.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        toggle.setAttribute('aria-expanded', 'true');
        if (labelEl) labelEl.textContent = 'Show Less';
      }
    });

    // Keep expanded panels correctly sized if content reflows (e.g. viewport resize)
    window.addEventListener('resize', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') {
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

/* --- Contact form validation (client-side only, MVP has no backend) --- */
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var valid = true;

    ['name', 'email', 'message'].forEach(function (fieldName) {
      var input = form.querySelector('[name="' + fieldName + '"]');
      if (!input) return;
      var wrapper = input.closest('.field');
      var isEmpty = input.value.trim() === '';
      var isBadEmail = fieldName === 'email' && input.value.trim() !== '' && !/^\S+@\S+\.\S+$/.test(input.value.trim());

      if (isEmpty || isBadEmail) {
        wrapper.classList.add('has-error');
        valid = false;
      } else {
        wrapper.classList.remove('has-error');
      }
    });

    if (valid) {
      form.hidden = true;
      var success = document.getElementById('form-success');
      if (success) success.classList.add('is-visible');
    }
  });
}

/* --- Online Admissions multi-step application --- */
function initAdmissionsApplication() {
  var form = document.getElementById('admissions-form');
  if (!form) return;

  var STORAGE_KEY = 'avsss-online-admissions-draft';
  var MAX_FILE_SIZE = 5 * 1024 * 1024;
  var ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
  var ACCEPTED_EXTENSIONS = /\.(pdf|jpe?g|png)$/i;

  var currentStep = 1;
  var steps = Array.prototype.slice.call(form.querySelectorAll('.application-step'));
  var progressItems = Array.prototype.slice.call(document.querySelectorAll('[data-progress-step]'));
  var alert = document.getElementById('admissions-alert');
  var prevButton = document.getElementById('prev-step');
  var nextButton = document.getElementById('next-step');
  var submitButton = document.getElementById('submit-application');
  var successPanel = document.getElementById('application-success');
  var referenceEl = document.getElementById('application-reference');
  var downloadButton = document.getElementById('download-confirmation');
  var disability = document.getElementById('disability');
  var disabilityOtherField = document.getElementById('disability-other-field');
  var disabilityOtherInput = document.getElementById('disability-other');
  var declaration = document.getElementById('declaration');

  var fieldLabels = {
    learnerFirstName: 'Learner First Name',
    middleName: 'Middle Name',
    surname: 'Surname',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    idNumber: 'ID Number / Birth Certificate Number',
    nationality: 'Nationality',
    homeLanguage: 'Home Language',
    additionalLanguage: 'Additional Language',
    currentGrade: 'Current Grade',
    gradeApplyingFor: 'Grade Applying For',
    previousSchool: 'Previous School',
    emisNumber: 'EMIS Number',
    disability: 'Disability',
    disabilityOther: 'Disability Details',
    learnerStreet: 'Street Address',
    learnerSuburb: 'Suburb',
    learnerCity: 'City',
    learnerProvince: 'Province',
    learnerPostal: 'Postal Code',
    learnerEmail: 'Learner Email',
    learnerMobile: 'Learner Mobile Number',
    guardianName: 'Full Name',
    relationship: 'Relationship to Learner',
    guardianId: 'Parent ID Number',
    guardianMobile: 'Mobile Number',
    guardianAlternative: 'Alternative Number',
    guardianEmail: 'Email Address',
    guardianOccupation: 'Occupation',
    guardianEmployer: 'Employer',
    guardianStreet: 'Street Address',
    guardianSuburb: 'Suburb',
    guardianCity: 'City',
    guardianProvince: 'Province',
    guardianPostal: 'Postal Code'
  };

  var reviewSections = [
    {
      title: 'Learner Details',
      step: 1,
      fields: ['learnerFirstName', 'middleName', 'surname', 'dateOfBirth', 'gender', 'idNumber', 'nationality', 'homeLanguage', 'additionalLanguage', 'currentGrade', 'gradeApplyingFor', 'previousSchool', 'emisNumber', 'disability', 'disabilityOther']
    },
    {
      title: 'Residential Address',
      step: 1,
      fields: ['learnerStreet', 'learnerSuburb', 'learnerCity', 'learnerProvince', 'learnerPostal', 'learnerEmail', 'learnerMobile']
    },
    {
      title: 'Parent / Guardian Information',
      step: 1,
      fields: ['guardianName', 'relationship', 'guardianId', 'guardianMobile', 'guardianAlternative', 'guardianEmail', 'guardianOccupation', 'guardianEmployer']
    },
    {
      title: 'Guardian Residential Address',
      step: 1,
      fields: ['guardianStreet', 'guardianSuburb', 'guardianCity', 'guardianProvince', 'guardianPostal']
    }
  ];

  restoreDraft();
  syncConditionalFields();
  showStep(currentStep, true);

  form.querySelectorAll('input, select, textarea').forEach(function (input) {
    input.addEventListener('input', function () {
      clearFieldError(input);
      if (input.type !== 'file') saveDraft();
    });
    input.addEventListener('change', function () {
      if (input === disability) syncConditionalFields();
      clearFieldError(input);
      if (input.type !== 'file') saveDraft();
      if (input.type === 'file') validateFileInput(input);
    });
  });

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      if (currentStep > 1) showStep(currentStep - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      if (!validateStep(currentStep)) return;
      if (currentStep === 2) renderReview();
      if (currentStep === 3) renderSubmitSummary();
      showStep(currentStep + 1);
    });
  }

  form.addEventListener('click', function (event) {
    var editButton = event.target.closest('[data-edit-step]');
    if (!editButton) return;
    showStep(Number(editButton.getAttribute('data-edit-step')));
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validateStep(1)) {
      showStep(1);
      return;
    }
    if (!validateStep(2)) {
      showStep(2);
      return;
    }
    if (!validateDeclaration()) {
      showStep(4);
      return;
    }

    var reference = createReferenceNumber();
    if (referenceEl) referenceEl.textContent = reference;
    localStorage.removeItem(STORAGE_KEY);
    form.hidden = true;
    if (successPanel) {
      successPanel.hidden = false;
      successPanel.focus();
    }
    if (alert) alert.classList.remove('is-visible');
  });

  if (downloadButton) {
    downloadButton.addEventListener('click', function () {
      var reference = referenceEl ? referenceEl.textContent : createReferenceNumber();
      downloadConfirmation(reference);
    });
  }

  function showStep(stepNumber, skipScroll) {
    currentStep = Math.max(1, Math.min(4, stepNumber));
    steps.forEach(function (step) {
      step.classList.toggle('is-active', Number(step.getAttribute('data-step')) === currentStep);
    });
    progressItems.forEach(function (item) {
      var itemStep = Number(item.getAttribute('data-progress-step'));
      item.classList.toggle('is-active', itemStep === currentStep);
      item.classList.toggle('is-complete', itemStep < currentStep);
    });
    if (prevButton) prevButton.hidden = currentStep === 1;
    if (nextButton) nextButton.hidden = currentStep === 4;
    if (submitButton) submitButton.hidden = currentStep !== 4;
    if (alert) alert.classList.remove('is-visible');
    if (!skipScroll) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function validateStep(stepNumber) {
    var step = form.querySelector('[data-step="' + stepNumber + '"]');
    if (!step) return true;
    var valid = true;

    step.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (input.type === 'file') {
        if (!validateFileInput(input)) valid = false;
      } else if (!validateTextInput(input)) {
        valid = false;
      }
    });

    if (!valid) {
      showAlert('Please complete the highlighted fields before continuing.');
      focusFirstError(step);
    }
    return valid;
  }

  function validateTextInput(input) {
    if (input.disabled || input.closest('[hidden]')) return true;
    var wrapper = input.closest('.field');
    var value = (input.value || '').trim();
    var isRequired = input.hasAttribute('required');
    var valid = true;

    if (isRequired && value === '') valid = false;
    if (valid && input.type === 'email' && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) valid = false;

    if (wrapper) wrapper.classList.toggle('has-error', !valid);
    return valid;
  }

  function validateFileInput(input) {
    if (input.disabled || input.closest('[hidden]')) return true;
    var wrapper = input.closest('.upload-field');
    var isRequired = input.hasAttribute('required');
    var files = Array.prototype.slice.call(input.files || []);
    var valid = true;

    if (isRequired && files.length === 0) valid = false;
    files.forEach(function (file) {
      var typeAllowed = ACCEPTED_TYPES.indexOf(file.type) !== -1 || ACCEPTED_EXTENSIONS.test(file.name);
      if (!typeAllowed || file.size > MAX_FILE_SIZE) valid = false;
    });

    if (wrapper) wrapper.classList.toggle('has-error', !valid);
    return valid;
  }

  function validateDeclaration() {
    var label = declaration ? declaration.closest('.declaration-check') : null;
    var valid = Boolean(declaration && declaration.checked);
    if (label) label.classList.toggle('has-error', !valid);
    if (!valid) {
      showAlert('Please accept the declaration before submitting your application.');
      if (declaration) declaration.focus();
    }
    return valid;
  }

  function clearFieldError(input) {
    var wrapper = input.closest('.field') || input.closest('.upload-field');
    if (wrapper) wrapper.classList.remove('has-error');
    if (input === declaration) {
      var label = declaration.closest('.declaration-check');
      if (label) label.classList.remove('has-error');
    }
  }

  function focusFirstError(scope) {
    var error = scope.querySelector('.has-error input, .has-error select, .has-error textarea');
    if (error) error.focus();
  }

  function showAlert(message) {
    if (!alert) return;
    alert.textContent = message;
    alert.classList.add('is-visible');
  }

  function syncConditionalFields() {
    var showOther = disability && disability.value === 'Other';
    if (!disabilityOtherField || !disabilityOtherInput) return;
    disabilityOtherField.hidden = !showOther;
    disabilityOtherInput.required = Boolean(showOther);
    if (!showOther) {
      disabilityOtherInput.value = '';
      disabilityOtherField.classList.remove('has-error');
    }
  }

  function saveDraft() {
    var data = {};
    form.querySelectorAll('input, select, textarea').forEach(function (input) {
      if (!input.name || input.type === 'file' || input.type === 'checkbox') return;
      data[input.name] = input.value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function restoreDraft() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      Object.keys(data).forEach(function (name) {
        var input = form.elements[name];
        if (input && input.type !== 'file') input.value = data[name];
      });
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  function getValue(name) {
    var field = form.elements[name];
    return field ? String(field.value || '').trim() : '';
  }

  function getFiles(name) {
    var field = form.elements[name];
    if (!field || !field.files) return [];
    return Array.prototype.slice.call(field.files).map(function (file) { return file.name; });
  }

  function renderReview() {
    var output = document.getElementById('review-output');
    if (!output) return;

    var html = reviewSections.map(function (section) {
      var rows = section.fields.map(function (fieldName) {
        var value = getValue(fieldName);
        if (!value && fieldName === 'disabilityOther') return '';
        return '<dt>' + escapeHtml(fieldLabels[fieldName] || fieldName) + '</dt><dd>' + escapeHtml(value || 'Not provided') + '</dd>';
      }).join('');

      return '<article class="review-card">' +
        '<div class="review-card-head"><h3>' + escapeHtml(section.title) + '</h3><button type="button" class="btn btn-ghost" data-edit-step="' + section.step + '">Edit</button></div>' +
        '<dl>' + rows + '</dl>' +
        '</article>';
    }).join('');

    html += renderDocumentReview();
    output.innerHTML = html;
  }

  function renderDocumentReview() {
    var documentFields = [
      ['birthCertificate', 'Learner Birth Certificate'],
      ['guardianIdDocument', 'Parent / Guardian ID'],
      ['schoolReport', 'Latest School Report'],
      ['proofResidence', 'Proof of Residence'],
      ['immunisationRecord', 'Immunisation Record'],
      ['passportPermit', 'Passport / Permit'],
      ['courtOrder', 'Court Order / Guardianship Documents'],
      ['otherDocuments', 'Other Supporting Documents']
    ];

    var rows = documentFields.map(function (item) {
      var files = getFiles(item[0]);
      return '<dt>' + escapeHtml(item[1]) + '</dt><dd>' + escapeHtml(files.length ? files.join(', ') : 'Not uploaded') + '</dd>';
    }).join('');

    return '<article class="review-card">' +
      '<div class="review-card-head"><h3>Supporting Documents</h3><button type="button" class="btn btn-ghost" data-edit-step="2">Edit</button></div>' +
      '<dl>' + rows + '</dl>' +
      '</article>';
  }

  function renderSubmitSummary() {
    var summary = document.getElementById('submit-summary');
    if (!summary) return;
    var learnerName = [getValue('learnerFirstName'), getValue('surname')].filter(Boolean).join(' ');
    var documents = form.querySelectorAll('input[type="file"]').length;
    var uploaded = Array.prototype.slice.call(form.querySelectorAll('input[type="file"]')).filter(function (input) {
      return input.files && input.files.length;
    }).length;

    summary.innerHTML = '<div class="summary-list">' +
      '<div><span>Learner</span><strong>' + escapeHtml(learnerName || 'Not provided') + '</strong></div>' +
      '<div><span>Grade Applying For</span><strong>' + escapeHtml(getValue('gradeApplyingFor') || 'Not provided') + '</strong></div>' +
      '<div><span>Documents Confirmed</span><strong>' + uploaded + ' of ' + documents + '</strong></div>' +
      '</div>';
  }

  function createReferenceNumber() {
    var number = String(Math.floor(Math.random() * 900000) + 100000);
    return 'AVSSS-2027-' + number;
  }

  function downloadConfirmation(reference) {
    var learnerName = [getValue('learnerFirstName'), getValue('surname')].filter(Boolean).join(' ');
    var content = [
      'Archie Velile Senior Secondary School',
      'Online Admissions Confirmation',
      '',
      'Reference Number: ' + reference,
      'Learner: ' + (learnerName || 'Not provided'),
      'Grade Applying For: ' + (getValue('gradeApplyingFor') || 'Not provided'),
      'Parent / Guardian: ' + (getValue('guardianName') || 'Not provided'),
      '',
      'Your application has been received successfully. The Admissions Office will review your submission and contact you should additional information be required.'
    ].join('\n');

    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = reference + '-confirmation.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}




(function () {
  // ============================================================
  // SINGLE CONFIGURABLE VALUE — update this each year, nothing else.
  // ============================================================
  const examDate = new Date("2026-10-26T18:13:00");

  const strip = document.getElementById('exam-countdown');
  if (!strip) return;

  const els = {
    days: document.getElementById('countdown-days'),
    hours: document.getElementById('countdown-hours'),
    minutes: document.getElementById('countdown-minutes'),
    seconds: document.getElementById('countdown-seconds'),
  };

  function pad(num) { return String(num).padStart(2, '0'); }

  function hideStrip() {
    strip.classList.add('is-hidden');
    setTimeout(() => { strip.style.display = 'none'; }, 850);
  }

  function tick() {
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();

    if (diff <= 0) {
      clearInterval(timerId);
      hideStrip();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    els.days.textContent = pad(days);
    els.hours.textContent = pad(hours);
    els.minutes.textContent = pad(minutes);
    els.seconds.textContent = pad(seconds);
  }

  tick();
  const timerId = setInterval(tick, 1000);
})();


  (function () {
    // ---------- Vacancy detail expand/collapse ----------
    document.querySelectorAll('.vacancy-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.vacancy-card');
        var detail = card.querySelector('.vacancy-detail');
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        detail.classList.toggle('is-open', !expanded);
        btn.childNodes[0].textContent = !expanded ? 'Hide Job Description ' : 'Read Full Job Description ';
      });
    });

    // ---------- Copy Link ----------
    document.querySelectorAll('.vacancy-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.vacancy-card');
        var url = window.location.origin + window.location.pathname + '#' + card.id;
        var finish = function () {
          btn.classList.add('is-copied');
          setTimeout(function () { btn.classList.remove('is-copied'); }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(finish).catch(function () {
            fallbackCopy(url);
            finish();
          });
        } else {
          fallbackCopy(url);
          finish();
        }
      });
    });

    function fallbackCopy(text) {
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(temp);
    }

    // ---------- Search & filter ----------
    var searchInput = document.getElementById('vacancy-search-input');
    var deptFilter = document.getElementById('vacancy-filter-department');
    var typeFilter = document.getElementById('vacancy-filter-type');
    var statusFilter = document.getElementById('vacancy-filter-status');
    var countEl = document.getElementById('vacancy-count');
    var emptyState = document.getElementById('vacancies-empty');
    var cards = document.querySelectorAll('.vacancy-card');

    function applyVacancyFilters() {
      var term = (searchInput.value || '').trim().toLowerCase();
      var dept = deptFilter.value;
      var type = typeFilter.value;
      var status = statusFilter.value;
      var visible = 0;

      cards.forEach(function (card) {
        var title = card.getAttribute('data-title') || '';
        var matches = (dept === 'all' || card.getAttribute('data-department') === dept) &&
                      (type === 'all' || card.getAttribute('data-type') === type) &&
                      (status === 'all' || card.getAttribute('data-status') === status) &&
                      (term === '' || title.indexOf(term) !== -1);
        card.setAttribute('data-hidden', matches ? 'false' : 'true');
        if (matches) visible++;
      });

      countEl.textContent = visible + (visible === 1 ? ' vacancy' : ' vacancies');
      emptyState.hidden = visible !== 0;
    }

    [searchInput, deptFilter, typeFilter, statusFilter].forEach(function (el) {
      el.addEventListener('input', applyVacancyFilters);
      el.addEventListener('change', applyVacancyFilters);
    });

    // ---------- FAQ accordion ----------
    document.querySelectorAll('.faq-question').forEach(function (q) {
      q.addEventListener('click', function () {
        var answer = q.nextElementSibling;
        var expanded = q.getAttribute('aria-expanded') === 'true';
        q.setAttribute('aria-expanded', String(!expanded));
        answer.classList.toggle('is-open', !expanded);
      });
    });
  })();

  (function () {
  var mainNav = document.querySelector('.main-nav');
  if (!mainNav) return;
  var savedScrollY = 0;

  var observer = new MutationObserver(function () {
    var isOpen = mainNav.classList.contains('is-open');
    if (isOpen) {
      savedScrollY = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
    } else if (document.documentElement.style.overflow === 'hidden') {
      document.documentElement.style.overflow = '';
      window.scrollTo(0, savedScrollY);
    }
  });

  observer.observe(mainNav, { attributes: true, attributeFilter: ['class'] });
})();