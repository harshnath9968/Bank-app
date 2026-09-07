/* =========================================================
   KANYAKA BANK — main.js
   Vanilla JS. Bootstrap 5 bundle must load before this file.
   ========================================================= */
(function () {
  'use strict';

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;

  /* Show the preloader once per browser tab instead of every navigation?
     Flip to true and it will only run on the first page of a session. */
  var PRELOADER_ONCE_PER_SESSION = false;
  var PRELOADER_MIN_MS = 1900;   // let the wordmark finish drawing
  var PRELOADER_MAX_MS = 5000;   // hard ceiling, even if an asset hangs

  /* ---------------------------------------------------------
     1. Preloader
     Removed on whichever comes first: assets loaded + minimum
     runtime, or the hard ceiling. It can never trap the page.
     --------------------------------------------------------- */
  (function preloader() {
    var el = document.getElementById('kbPreloader');
    if (!el) { document.body.classList.remove('kb-preloading'); return; }

    var started = Date.now();
    var closed = false;

    function hide(instant) {
      if (closed) return;
      closed = true;
      document.body.classList.remove('kb-preloading');
      el.classList.add('kb-done');
      try { sessionStorage.setItem('kbSeenPreloader', '1'); } catch (e) { /* ignore */ }
      window.setTimeout(function () {
        el.setAttribute('hidden', '');
        el.setAttribute('aria-hidden', 'true');
      }, instant ? 0 : 600);
    }

    function finish() {
      var waited = Date.now() - started;
      window.setTimeout(hide, Math.max(0, PRELOADER_MIN_MS - waited));
    }

    var seen = false;
    try { seen = sessionStorage.getItem('kbSeenPreloader') === '1'; } catch (e) { /* private mode */ }

    if ((PRELOADER_ONCE_PER_SESSION && seen) || reduced) { hide(true); return; }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    window.setTimeout(hide, PRELOADER_MAX_MS);          // failsafe
    window.addEventListener('pageshow', function (e) {   // bfcache restore
      if (e.persisted) hide(true);
    });
  })();

  /* ---------------------------------------------------------
     2. Live clock in the utility bar
     --------------------------------------------------------- */
  (function clock() {
    var out = document.getElementById('kbClock');
    if (!out) return;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function tick() {
      var now = new Date();
      out.textContent = pad(now.getDate()) + '-' + pad(now.getMonth() + 1) + '-' +
                        now.getFullYear() + '  ' +
                        pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
      out.setAttribute('datetime', now.toISOString());
    }
    tick();
    window.setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------
     3. Footer year
     --------------------------------------------------------- */
  var yearEl = document.getElementById('kbYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     4. Header height -> --kb-header-h, so anchor offsets stay
        correct at every breakpoint and after any nav change.
     --------------------------------------------------------- */
  var header = document.getElementById('kbHeader');
  function syncHeaderHeight() {
    if (!header) return;
    document.documentElement.style.setProperty('--kb-header-h', header.offsetHeight + 'px');
  }
  syncHeaderHeight();
  window.addEventListener('resize', debounce(syncHeaderHeight, 150));
  if ('ResizeObserver' in window && header) new ResizeObserver(syncHeaderHeight).observe(header);

  /* ---------------------------------------------------------
     5. Sticky header shadow + back to top
     --------------------------------------------------------- */
  var backTop = document.getElementById('kbBackTop');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (backTop) backTop.classList.toggle('is-shown', y > 460);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var skip = document.querySelector('.kb-skip');
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ---------------------------------------------------------
     6. Desktop hover dropdowns
     Driven through Bootstrap's own instance so hover and click
     never disagree about whether a menu is open.
     --------------------------------------------------------- */
  var hoverMq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1200px)');

  document.querySelectorAll('.kb-navbar .dropdown').forEach(function (dd) {
    var toggle = dd.querySelector('[data-bs-toggle="dropdown"]');
    if (!toggle || !window.bootstrap) return;

    dd.addEventListener('mouseenter', function () {
      if (!hoverMq.matches) return;
      window.bootstrap.Dropdown.getOrCreateInstance(toggle).show();
    });
    dd.addEventListener('mouseleave', function () {
      if (!hoverMq.matches) return;
      window.bootstrap.Dropdown.getOrCreateInstance(toggle).hide();
    });
  });

  /* ---------------------------------------------------------
     7. Close the mobile menu once a link is chosen
     --------------------------------------------------------- */
  var navCollapse = document.getElementById('kbNav');
  if (navCollapse && window.bootstrap) {
    navCollapse.querySelectorAll('a.nav-link:not(.dropdown-toggle), a.dropdown-item, .kb-nav-actions a')
      .forEach(function (link) {
        link.addEventListener('click', function () {
          if (navCollapse.classList.contains('show')) {
            window.bootstrap.Collapse.getOrCreateInstance(navCollapse, { toggle: false }).hide();
          }
        });
      });
  }

  /* ---------------------------------------------------------
     8. Hero carousel: pause control + hidden slides kept out
        of the tab order and the accessibility tree
     --------------------------------------------------------- */
  (function hero() {
    var root = document.getElementById('kbHeroCarousel');
    if (!root || !window.bootstrap) return;

    var carousel = window.bootstrap.Carousel.getOrCreateInstance(root);
    var pauseBtn = document.getElementById('kbHeroPause');
    var supportsInert = 'inert' in HTMLElement.prototype;

    function syncSlides() {
      root.querySelectorAll('.carousel-item').forEach(function (item) {
        var active = item.classList.contains('active');
        if (supportsInert) {
          item.inert = !active;
        } else {
          item.querySelectorAll('a, button, input, select, textarea').forEach(function (node) {
            if (active) node.removeAttribute('tabindex');
            else node.setAttribute('tabindex', '-1');
          });
        }
        item.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }
    root.addEventListener('slid.bs.carousel', syncSlides);
    syncSlides();

    var paused = false;
    function setPaused(next) {
      paused = next;
      if (paused) carousel.pause(); else carousel.cycle();
      if (!pauseBtn) return;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.querySelector('i').className = paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
      pauseBtn.querySelector('.visually-hidden').textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    }

    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });

    /* Hover and keyboard focus both hold the slideshow, and neither
       can override an explicit pause from the button. */
    function hold() { if (!paused) carousel.pause(); }
    function release() { if (!paused) carousel.cycle(); }

    root.addEventListener('mouseenter', hold);
    root.addEventListener('mouseleave', release);
    root.addEventListener('focusin', hold);
    root.addEventListener('focusout', function (e) {
      if (!root.contains(e.relatedTarget)) release();
    });

    if (reduced) setPaused(true);
    motionQuery.addEventListener('change', function (e) { if (e.matches) setPaused(true); });
  })();

  /* ---------------------------------------------------------
     9. What's-new marquee
     The track is doubled in JS so the loop is seamless, and
     the clones are hidden from assistive technology.
     --------------------------------------------------------- */
  (function marquee() {
    var track = document.querySelector('.kb-marquee-track');
    var toggle = document.getElementById('kbMarqueeToggle');
    if (!track) return;

    if (!reduced) {
      var clone = track.cloneNode(true);
      clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      Array.prototype.slice.call(clone.children).forEach(function (li) {
        li.setAttribute('aria-hidden', 'true');
        track.appendChild(li);
      });
      track.classList.add('is-doubled');
    }

    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.querySelector('i').className = paused ? 'bi bi-play-fill' : 'bi bi-pause-fill';
      toggle.querySelector('.visually-hidden').textContent =
        paused ? 'Resume scrolling headlines' : 'Pause scrolling headlines';
    });
  })();

  /* ---------------------------------------------------------
     10. Scroll rails (banking services, product range)
     --------------------------------------------------------- */
  function setupRail(railId, nowId, totalId) {
    var rail = document.getElementById(railId);
    if (!rail) return;

    var nav = rail.parentElement.querySelector('.kb-rail-nav');
    var nowEl = document.getElementById(nowId);
    var totalEl = document.getElementById(totalId);
    var items = rail.children;
    if (totalEl) totalEl.textContent = items.length;

    function step() {
      if (!items.length) return rail.clientWidth;
      var first = items[0].getBoundingClientRect();
      var gap = items.length > 1
        ? items[1].getBoundingClientRect().left - first.right
        : 0;
      return first.width + Math.max(gap, 0);
    }

    function update() {
      var s = step() || 1;
      var index = Math.round(rail.scrollLeft / s) + 1;
      var maxScroll = rail.scrollWidth - rail.clientWidth;
      if (nowEl) nowEl.textContent = Math.min(index, items.length);
      if (!nav) return;
      var prev = nav.querySelector('[data-kb-rail="prev"]');
      var next = nav.querySelector('[data-kb-rail="next"]');
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= maxScroll - 2;
    }

    if (nav) {
      nav.querySelectorAll('[data-kb-rail]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dir = btn.getAttribute('data-kb-rail') === 'next' ? 1 : -1;
          rail.scrollBy({ left: dir * step(), behavior: reduced ? 'auto' : 'smooth' });
        });
      });
    }

    rail.addEventListener('scroll', throttle(update, 120), { passive: true });
    window.addEventListener('resize', debounce(update, 150));
    update();
  }
  setupRail('kbServiceRail', 'kbRailNow', 'kbRailTotal');
  setupRail('kbProductRail', 'kbProdNow', 'kbProdTotal');

  /* ---------------------------------------------------------
     11. Animated counters
     --------------------------------------------------------- */
  function formatCount(value, decimals) {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-target') || '0');
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

    if (reduced) { el.textContent = formatCount(target, decimals); return; }

    var duration = 1500;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatCount(target * eased, decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var countEls = document.querySelectorAll('.kb-count');
  if (countEls.length) {
    if (!('IntersectionObserver' in window)) {
      countEls.forEach(animateCount);
    } else {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          countObs.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      countEls.forEach(function (el) { countObs.observe(el); });
    }
  }

  /* ---------------------------------------------------------
     12. EMI calculator
     Visible figures update live; the spoken announcement waits
     for the slider to be released so it is not read on every
     pixel of a drag.
     --------------------------------------------------------- */
  (function emi() {
    var amount = document.getElementById('emiAmount');
    var years = document.getElementById('emiYears');
    var rate = document.getElementById('emiRate');
    if (!amount || !years || !rate) return;

    var inr = new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    });

    var out = {
      amount: document.getElementById('emiAmountOut'),
      years: document.getElementById('emiYearsOut'),
      rate: document.getElementById('emiRateOut'),
      emi: document.getElementById('emiValue'),
      principal: document.getElementById('emiPrincipal'),
      interest: document.getElementById('emiInterest'),
      total: document.getElementById('emiTotal'),
      ring: document.getElementById('emiRing'),
      pct: document.getElementById('emiPct'),
      say: document.getElementById('emiAnnounce')
    };

    function paintTrack(input) {
      var min = parseFloat(input.min);
      var max = parseFloat(input.max);
      var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
      input.style.setProperty(
        '--kb-fill',
        'linear-gradient(90deg, #c1132b 0%, #c1132b ' + pct + '%, #eadfce ' + pct + '%)'
      );
    }

    var last = { emi: '', total: '' };

    function calc() {
      var principal = parseFloat(amount.value);
      var yrs = parseFloat(years.value);
      var annual = parseFloat(rate.value);
      var months = yrs * 12;
      var monthly = annual / 1200;

      var payment;
      if (monthly === 0) {
        payment = principal / months;
      } else {
        var factor = Math.pow(1 + monthly, months);
        payment = (principal * monthly * factor) / (factor - 1);
      }

      var total = payment * months;
      var interest = total - principal;
      var share = total > 0 ? (interest / total) * 100 : 0;

      if (out.amount) out.amount.textContent = inr.format(principal);
      if (out.years) out.years.textContent = yrs + (yrs === 1 ? ' year' : ' years');
      if (out.rate) out.rate.textContent = annual.toFixed(2) + '% p.a.';
      if (out.emi) out.emi.textContent = inr.format(payment);
      if (out.principal) out.principal.textContent = inr.format(principal);
      if (out.interest) out.interest.textContent = inr.format(interest);
      if (out.total) out.total.textContent = inr.format(total);
      if (out.pct) out.pct.textContent = Math.round(share) + '%';
      if (out.ring) {
        out.ring.style.setProperty('--p', share.toFixed(1));
        out.ring.setAttribute('aria-label',
          'Interest is ' + Math.round(share) + ' percent of the total repayment');
      }

      last.emi = inr.format(payment);
      last.total = inr.format(total);

      [amount, years, rate].forEach(paintTrack);
    }

    function announce() {
      if (!out.say) return;
      out.say.textContent = 'Monthly instalment ' + last.emi + '. Total payable ' + last.total + '.';
    }

    [amount, years, rate].forEach(function (input) {
      input.addEventListener('input', calc);
      input.addEventListener('change', announce);
    });

    calc();
  })();

  /* ---------------------------------------------------------
     13. Language switcher (UI state only — wire to your i18n)
     --------------------------------------------------------- */
  document.querySelectorAll('[data-kb-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var label = btn.textContent.trim();
      var trigger = btn.closest('.kb-lang').querySelector('.kb-lang-btn');
      if (trigger) trigger.innerHTML = '<i class="bi bi-translate" aria-hidden="true"></i> ' + label;
      document.dispatchEvent(new CustomEvent('kb:language', {
        detail: { lang: btn.getAttribute('data-kb-lang') }
      }));
    });
  });

  /* ---------------------------------------------------------
     14. Scroll reveal, applied to section blocks only
     --------------------------------------------------------- */
  (function reveal() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll(
      '.kb-section > .container > .row, .kb-head, .kb-rail-wrap, .kb-strength-grid, .kb-table-wrap'
    );
    targets.forEach(function (el) { el.classList.add('kb-reveal'); });

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { obs.observe(el); });
  })();

  /* ---------------------------------------------------------
     Helpers
     --------------------------------------------------------- */
  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function throttle(fn, wait) {
    var ready = true;
    return function () {
      if (!ready) return;
      ready = false;
      fn.apply(this, arguments);
      setTimeout(function () { ready = true; }, wait);
    };
  }
})();
