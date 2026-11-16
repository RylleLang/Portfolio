/* ═══════════════════════════════════════════════════════════
   Portfolio — interactions
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  /* ── mobile menu ─────────────────────────────────────── */
  function closeMenu() {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    mobileMenu.hidden = true;
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      mobileMenu.hidden = open;
    });

    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ── sticky / auto-hiding nav ────────────────────────── */
  var lastY = window.pageYOffset;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;

    if (nav) {
      nav.classList.toggle("is-stuck", y > 40);

      var menuOpen = toggle && toggle.getAttribute("aria-expanded") === "true";
      var goingDown = y > lastY && y > 300;
      nav.classList.toggle("is-hidden", goingDown && !menuOpen);
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ── scroll reveal ───────────────────────────────────── */
  var revealTargets = document.querySelectorAll(
    ".hero__text, .hero__photo, .section__head, .about__photo, .about__text, " +
      ".exp-card, .card, .twocol__col, .contact"
  );

  Array.prototype.forEach.call(revealTargets, function (el) {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    Array.prototype.forEach.call(revealTargets, function (el) {
      revealObserver.observe(el);
    });
  } else {
    Array.prototype.forEach.call(revealTargets, function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ── active nav link ─────────────────────────────────── */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll('.nav__links a[href^="#"]');

  function setActive(id) {
    Array.prototype.forEach.call(navLinks, function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    Array.prototype.forEach.call(sections, function (section) {
      spyObserver.observe(section);
    });
  }

  /* ── social buttons with a non-visible target ────────── */
  var socialBtns = document.querySelectorAll(".social-btn[data-url]");

  Array.prototype.forEach.call(socialBtns, function (btn) {
    btn.addEventListener("click", function () {
      var url;
      try {
        url = atob(btn.getAttribute("data-url"));
      } catch (e) {
        return;
      }
      // app deep links (viber:) must stay in the current tab — window.open
      // leaves an orphaned blank tab behind when the handler takes over
      if (/^https?:/i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = url;
      }
    });
  });

  /* ── footer year ─────────────────────────────────────── */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ── project screenshot galleries ───────────────────── */
  var galleries = document.querySelectorAll("[data-gallery]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Array.prototype.forEach.call(galleries, function (gallery) {
    var slides = Array.prototype.slice.call(
      gallery.querySelectorAll("[data-gallery-slide]")
    );
    var dots = Array.prototype.slice.call(
      gallery.querySelectorAll("[data-gallery-target]")
    );
    var previous = gallery.querySelector("[data-gallery-prev]");
    var next = gallery.querySelector("[data-gallery-next]");
    var toggle = gallery.querySelector("[data-gallery-toggle]");
    var status = gallery.querySelector("[data-gallery-status]");

    if (slides.length < 2 || dots.length !== slides.length || !previous || !next || !toggle) {
      return;
    }

    var activeIndex = 0;
    var isPlaying = !reduceMotion;
    var isHovered = false;
    var isFocused = false;
    var isVisible = !("IntersectionObserver" in window);
    var timer;

    slides.forEach(function (slide, i) {
      if (i > 0) {
        slide.querySelector("img").loading = "eager";
      }
    });

    function showSlide(index, announce) {
      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        var active = i === activeIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach(function (dot, i) {
        var active = i === activeIndex;
        dot.classList.toggle("is-active", active);
        if (active) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });

      if (announce && status) {
        status.textContent = slides[activeIndex].querySelector("img").alt;
        status.setAttribute("aria-live", "polite");
      } else if (status) {
        status.setAttribute("aria-live", "off");
      }
    }

    function stopTimer() {
      window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      stopTimer();
      if (!isPlaying || !isVisible || isHovered || isFocused || document.hidden) return;
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1, false);
      }, 5000);
    }

    function updateToggle() {
      var path = toggle.querySelector("path");
      toggle.setAttribute("aria-label", isPlaying ? "Pause slideshow" : "Play slideshow");
      toggle.setAttribute("aria-pressed", String(!isPlaying));
      path.setAttribute(
        "d",
        isPlaying ? "M8 5h3v14H8zM15 5h3v14h-3z" : "m8 5 11 7-11 7z"
      );
      path.setAttribute("fill", isPlaying ? "none" : "currentColor");
      startTimer();
    }

    previous.addEventListener("click", function () {
      showSlide(activeIndex - 1, true);
      startTimer();
    });
    next.addEventListener("click", function () {
      showSlide(activeIndex + 1, true);
      startTimer();
    });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        showSlide(i, true);
        startTimer();
      });
    });
    toggle.addEventListener("click", function () {
      isPlaying = !isPlaying;
      updateToggle();
    });
    gallery.addEventListener("mouseenter", function () {
      isHovered = true;
      stopTimer();
    });
    gallery.addEventListener("mouseleave", function () {
      isHovered = false;
      startTimer();
    });
    gallery.addEventListener("focusin", function () {
      isFocused = true;
      stopTimer();
    });
    gallery.addEventListener("focusout", function (event) {
      if (gallery.contains(event.relatedTarget)) return;
      isFocused = false;
      startTimer();
    });
    document.addEventListener("visibilitychange", startTimer);

    if ("IntersectionObserver" in window) {
      var galleryObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startTimer();
          } else {
            stopTimer();
          }
        });
      });
      galleryObserver.observe(gallery);
    }

    updateToggle();
  });
})();
