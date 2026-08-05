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
      ".exp, .card, .twocol__col, .contact"
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
})();
