/* ==========================================================================
   GALLERY PAGE — reveal-on-scroll, staggered entrance, accessible lightbox
   Archie Velile Senior Secondary School
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     1. Staggered entrance — sets --i on each child of a .stagger container
        so CSS (.stagger > * { transition-delay: calc(var(--i,0) * 90ms) })
        produces a cascading reveal instead of everything firing at once.
     --------------------------------------------------------------------- */
  document.querySelectorAll(".stagger").forEach(function (container) {
    Array.prototype.forEach.call(container.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  });

  /* ---------------------------------------------------------------------
     2. Reveal-on-scroll — adds .is-visible the first time an element
        enters the viewport, then stops observing it.
     --------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal, .reveal-scale");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     3. Lightbox
     --------------------------------------------------------------------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  if (!items.length) { return; }

  var lightbox = document.getElementById("galleryLightbox");
  var mediaEl = document.getElementById("lightboxMedia");
  var categoryEl = document.getElementById("lightboxCategory");
  var titleEl = document.getElementById("lightboxTitle");
  var descEl = document.getElementById("lightboxDesc");
  var countEl = document.getElementById("lightboxCount");
  var closeBtn = document.getElementById("lightboxClose");
  var prevBtn = document.getElementById("lightboxPrev");
  var nextBtn = document.getElementById("lightboxNext");

  var currentIndex = 0;
  var lastFocused = null;

  function render(index) {
    var item = items[index];
    var accent = item.getAttribute("data-accent") || "var(--navy-primary)";
    var img = item.getAttribute("data-img");

    mediaEl.style.setProperty("--cat-color", accent);
    if (img) {
      mediaEl.style.setProperty("--gallery-img", "url('" + img + "')");
    } else {
      mediaEl.style.removeProperty("--gallery-img");
    }

    categoryEl.textContent = item.getAttribute("data-category") || "";
    titleEl.textContent = item.getAttribute("data-title") || "";
    var desc = item.getAttribute("data-desc") || "";
    descEl.textContent = desc;
    descEl.hidden = !desc;
    countEl.textContent = (index + 1) + " of " + items.length;
  }

  function open(index) {
    currentIndex = index;
    lastFocused = document.activeElement;
    render(currentIndex);
    lightbox.hidden = false;
    /* allow the browser to paint hidden->flex before animating in */
    requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    var finish = function () {
      lightbox.hidden = true;
      lightbox.removeEventListener("transitionend", finish);
    };
    if (reduceMotion) {
      finish();
    } else {
      lightbox.addEventListener("transitionend", finish);
    }
    if (lastFocused) { lastFocused.focus(); }
  }

  function showNext() { open((currentIndex + 1) % items.length); }
  function showPrev() { open((currentIndex - 1 + items.length) % items.length); }

  function getFocusable() {
    return Array.prototype.slice.call(
      lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      showNext();
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      showPrev();
      return;
    }
    if (e.key === "Tab") {
      var focusable = getFocusable();
      if (!focusable.length) { return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  items.forEach(function (item, index) {
    item.addEventListener("click", function () { open(index); });
  });

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  /* Click on the dark backdrop (outside the stage) also closes */
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) { close(); }
  });
})();