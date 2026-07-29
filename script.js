document.addEventListener('DOMContentLoaded', function () {
  // ---- Day / Night mode toggle ----
  const THEME_KEY = 'preferredTheme'; // 'light' or 'dark'
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeToggleSide = document.getElementById('themeToggleSide');
  const themeIconSide = document.getElementById('themeIconSide');
  const themeLabelSide = document.getElementById('themeLabelSide');

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light-mode', isLight);

    if (themeIcon) themeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if (themeIconSide) themeIconSide.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    if (themeLabelSide) themeLabelSide.textContent = isLight ? 'Night mode' : 'Day mode';
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
  }

  let savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* storage unavailable */ }
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleSide) themeToggleSide.addEventListener('click', toggleTheme);

  // ---- Preloader: cycle through greetings before the home page reveals ----
  const preloader = document.getElementById('preloader');
  const preloaderText = document.getElementById('preloader-text');

  if (preloader && preloaderText) {
    const greetings = [
      'Hello', 'Bonjour', 'Hola', 'Ciao', 'Hallo',
      'こんにちは', '안녕하세요', 'नमस्ते', 'হ্যালো', 'Olá'
    ];
    const GREETING_INTERVAL = 180; // ms between each greeting
    const MIN_VISIBLE_TIME = 1600; // ms preloader stays up at minimum

    let i = 0;
    preloaderText.textContent = greetings[0];
    const greetingTimer = setInterval(function () {
      i = (i + 1) % greetings.length;
      preloaderText.textContent = greetings[i];
    }, GREETING_INTERVAL);

    window.setTimeout(function () {
      clearInterval(greetingTimer);
      preloaderText.textContent = 'Welcome';
      window.setTimeout(function () {
        preloader.classList.add('hidden');
      }, 350);
    }, MIN_VISIBLE_TIME);
  }

  const scrollContainer = document.getElementById('scrollContainer');
  const sections = Array.from(document.querySelectorAll('.snap-section'));
  const allLinks = document.querySelectorAll('.nav-link, .side-link');

  // ---- Highlight the nav link matching the section currently in view ----
  function setActive(id) {
    allLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, { root: scrollContainer, threshold: 0.5 });

  sections.forEach(function (section) { observer.observe(section); });
  if (sections.length) setActive(sections[0].id);

  // ---- Nav background/blur appears once the page has scrolled ----
  const topNav = document.querySelector('.top-nav');

  function syncNavToScroll() {
    if (topNav) topNav.classList.toggle('scrolled', scrollContainer.scrollTop > 10);
  }

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', syncNavToScroll, { passive: true });
    syncNavToScroll();
  }

  // ---- Side menu open/close ----
  const menuBtn = document.getElementById('menuBtn');
  const menuClose = document.getElementById('menuClose');
  const sideMenu = document.getElementById('sideMenu');
  const backdrop = document.getElementById('menuBackdrop');

  function openMenu() {
    sideMenu.classList.add('open');
    backdrop.classList.add('open');
  }

  function closeMenu() {
    sideMenu.classList.remove('open');
    backdrop.classList.remove('open');
  }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  // ---- Slow, eased custom scroll animation (replaces native instant snap) ----
  const SCROLL_DURATION = 200; // ms — raise/lower this to make it slower/faster
  let isAnimatingScroll = false;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateScrollTo(targetY, duration) {
    if (!scrollContainer) return;
    const startY = scrollContainer.scrollTop;
    const diff = targetY - startY;
    if (Math.abs(diff) < 1) return;

    isAnimatingScroll = true;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      scrollContainer.scrollTop = startY + diff * easeInOutCubic(progress);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimatingScroll = false;
      }
    }
    requestAnimationFrame(step);
  }

  // ---- Smooth-scroll to a section instead of loading a new page ----
  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (target) animateScrollTo(target.offsetTop, SCROLL_DURATION);
  }

  const pageTransitionOverlay = document.getElementById('pageTransitionOverlay');
  const pageTransitionText = document.getElementById('pageTransitionText');
  const TRANSITION_SHOW_TIME = 350; // ms the section name is shown before scrolling

  function goToSectionWithTransition(link, id) {
    const label = link.textContent.trim();

    if (pageTransitionOverlay && pageTransitionText && label) {
      pageTransitionText.textContent = label;
      pageTransitionOverlay.classList.add('active');

      window.setTimeout(function () {
        scrollToSection(id);
        window.setTimeout(function () {
          pageTransitionOverlay.classList.remove('active');
        }, 250);
      }, TRANSITION_SHOW_TIME);
    } else {
      scrollToSection(id);
    }
  }

  document.querySelectorAll('a.section-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      e.preventDefault();
      closeMenu();
      goToSectionWithTransition(link, href.slice(1));
    });
  });

  // ---- Looping typewriter effect on the hero heading ----
  const typewriterEl = document.getElementById('typewriter-text');
  if (typewriterEl) {
    const fullText = 'Software Engineer.';
    const TYPE_SPEED = 90;      // ms per character while typing
    const DELETE_SPEED = 45;    // ms per character while deleting
    const HOLD_AFTER_TYPE = 1400; // pause once fully typed
    const HOLD_AFTER_DELETE = 400; // pause once fully deleted
    let charIndex = 0;
    let isDeleting = false;

    function typewriterTick() {
      if (!isDeleting) {
        charIndex++;
        typewriterEl.textContent = fullText.slice(0, charIndex);
        if (charIndex === fullText.length) {
          isDeleting = true;
          setTimeout(typewriterTick, HOLD_AFTER_TYPE);
          return;
        }
        setTimeout(typewriterTick, TYPE_SPEED);
      } else {
        charIndex--;
        typewriterEl.textContent = fullText.slice(0, charIndex);
        if (charIndex === 0) {
          isDeleting = false;
          setTimeout(typewriterTick, HOLD_AFTER_DELETE);
          return;
        }
        setTimeout(typewriterTick, DELETE_SPEED);
      }
    }

    typewriterTick();
  }

  // ---- Scroll hint on the hero jumps to the Project section ----
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', function () { scrollToSection('project'); });
    scrollHint.style.cursor = 'pointer';
  }

  // ---- Project "View Image" lightbox ----
  const imgModal = document.getElementById('imgModal');
  const imgModalBackdrop = document.getElementById('imgModalBackdrop');
  const imgModalClose = document.getElementById('imgModalClose');
  const imgModalPicture = document.getElementById('imgModalPicture');
  const imgModalTitle = document.getElementById('imgModalTitle');
  const imgViewButtons = document.querySelectorAll('.img-view-btn');

  function openImgModal(src, title) {
    if (!imgModal || !imgModalPicture) return;
    imgModalPicture.src = src;
    imgModalPicture.alt = title || 'Project screenshot';
    if (imgModalTitle) imgModalTitle.textContent = title || '';
    imgModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeImgModal() {
    if (!imgModal) return;
    imgModal.classList.remove('open');
    document.body.style.overflow = '';
    if (imgModalPicture) imgModalPicture.src = '';
  }

  imgViewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      openImgModal(btn.getAttribute('data-img'), btn.getAttribute('data-title'));
    });
  });

  if (imgModalBackdrop) imgModalBackdrop.addEventListener('click', closeImgModal);
  if (imgModalClose) imgModalClose.addEventListener('click', closeImgModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && imgModal && imgModal.classList.contains('open')) closeImgModal();
  });

  // ---- Contact Form Submission to Google Sheets ----
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzOFdvDiIenazXLS8Ki1e4Eox1BO5jiZNtcQEtYA9UFcQtTdOG4HQJJJggUlO-5s8KR/exec';
  const form = document.querySelector('.contact-form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = form.querySelector('[name="name"]') ? form.querySelector('[name="name"]').value : document.getElementById('name').value;
      const email = form.querySelector('[name="email"]') ? form.querySelector('[name="email"]').value : document.getElementById('email').value;
      const message = form.querySelector('[name="message"]') ? form.querySelector('[name="message"]').value : document.getElementById('message').value;

      const data = { name: name, email: email, message: message };

      fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(data)
      })
      .then(response => {
        alert('Message successfully sent and saved to sheet!');
        form.reset();
      })
      .catch(error => {
        console.error('Error!', error.message);
        alert('Failed to send message.');
      });
    });
  }
});

