/* ============================================================
   Guru IPTV — motion layer
   GSAP + ScrollTrigger for anything scroll-linked or continuous.
   CSS owns hovers and simple fades.

   Rules this file follows:
   - Nothing animates unless it changes what the reader understands.
   - Every scroll animation is transform/opacity only (no layout thrash).
   - prefers-reduced-motion: reduce  ->  the whole file no-ops and the
     page renders as a static document.
   - If GSAP fails to load, the .js-motion entry states are stripped so
     content can never be left invisible.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCED = !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* footer year — runs regardless of motion preference */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- bail-outs ---------- */
  if (REDUCED) {
    root.classList.remove('js-motion');
    return;
  }
  if (!window.gsap || !window.ScrollTrigger) {
    // CDN blocked or offline: drop the hidden-entry states so the page reads normally.
    root.classList.remove('js-motion');
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var isTouch = window.matchMedia('(hover: none)').matches;
  var isNarrow = window.matchMedia('(max-width: 720px)').matches;

  /* ============================================================
     1. HEADER — hide on scroll down, show on scroll up
     ============================================================ */
  (function header() {
    var head = document.querySelector('[data-head]');
    if (!head) return;
    var last = 0;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        if (y > 8) head.setAttribute('data-stuck', ''); else head.removeAttribute('data-stuck');
        if (y > last && y > 300) head.setAttribute('data-hidden', '');
        else head.removeAttribute('data-hidden');
        last = y;
      }
    });
  })();

  /* ============================================================
     2. HERO — the cinematic pull-back
     Opens hard on the screen (scene scaled up, transform-origin
     locked to the TV screen centre), then scrubs out to the full
     room as the reader scrolls. Copy and the paper wash arrive
     on the back half of the same timeline.
     ============================================================ */
  (function hero() {
    var hero = document.querySelector('[data-hero]');
    var stage = document.querySelector('[data-hero-stage]');
    var scene = document.querySelector('[data-hero-scene]');
    var veil = document.querySelector('[data-hero-veil]');
    var copy = document.querySelector('[data-hero-copy]');
    var cue = document.querySelector('[data-hero-scroll]');
    if (!hero || !stage || !scene || !copy) return;

    /* split the h1 into per-line inner spans so each can translate
       behind its own overflow:hidden parent */
    var h1Lines = [];
    document.querySelectorAll('.hero__h1 span').forEach(function (line) {
      var inner = document.createElement('span');
      inner.style.display = 'block';
      inner.style.willChange = 'transform';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
      h1Lines.push(inner);
    });

    var otherCopy = copy.querySelectorAll('.eyebrow, .hero__sub, .hero__actions');

    /* start state */
    var START_SCALE = isNarrow ? 5.4 : 4.6;
    gsap.set(scene, { scale: START_SCALE });
    gsap.set(veil, { opacity: 0 });
    gsap.set(copy, { opacity: 1 });
    gsap.set(h1Lines, { yPercent: 115 });
    gsap.set(otherCopy, { opacity: 0, y: 22 });

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        /* Pinning is CSS `position: sticky` on .hero__stage — see styles.css.
           ScrollTrigger owns only the scrubbed timeline. */
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          if (self.progress > 0.55) stage.setAttribute('data-lit', '');
          else stage.removeAttribute('data-lit');
        }
      }
    });

    tl.to(scene, { scale: 1, ease: 'power1.inOut', duration: 1 }, 0)
      .to(veil, { opacity: 1, ease: 'none', duration: 0.42 }, 0.5)
      .to(h1Lines, { yPercent: 0, ease: 'power3.out', duration: 0.34, stagger: 0.07 }, 0.56)
      .to(otherCopy, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.28, stagger: 0.06 }, 0.7);

    if (cue) {
      gsap.to(cue, {
        opacity: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '18% top', scrub: true }
      });
    }
  })();

  /* ============================================================
     3. STAGGERED TEXT / BLOCK REVEALS
     ============================================================ */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  gsap.utils.toArray('[data-stagger]').forEach(function (group) {
    gsap.to(group.children, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.055,
      scrollTrigger: { trigger: group, start: 'top 85%', once: true }
    });
  });

  /* ============================================================
     4. FEATURE ROWS — text lift + image mask wipe + inner scale
     ============================================================ */
  gsap.utils.toArray('[data-frow]').forEach(function (row) {
    var num = row.querySelector('.frow__num');
    var body = row.querySelector('.frow__body');
    var mask = row.querySelector('[data-mask]');
    var art = mask ? mask.querySelector('svg') : null;

    var tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: 'top 78%', once: true }
    });

    tl.to([num, body], { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0);

    if (mask && art) {
      tl.to(mask, { clipPath: 'inset(0 0 0% 0)', duration: 1.05, ease: 'power3.inOut' }, 0.05)
        .to(art, { scale: 1, duration: 1.3, ease: 'power2.out' }, 0.05);
    }

    /* light parallax on the artwork while the row is in view */
    if (art && !isNarrow) {
      gsap.fromTo(art, { yPercent: -3 }, {
        yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }
  });

  /* ============================================================
     5. MARQUEES — language band + content rail
     Duplicated tracks, linear px-based loop measured off the DOM so
     the seam is exact regardless of flex gap. Paused when offscreen
     and on hover, so it costs nothing when nobody is looking.
     ============================================================ */
  gsap.utils.toArray('[data-marquee]').forEach(function (wrap) {
    var track = wrap.querySelector('[data-marquee-track]');
    if (!track) return;

    var speed = parseFloat(wrap.getAttribute('data-speed')) || 50; // px per second
    var reverse = wrap.getAttribute('data-reverse') === '1';
    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    var tween = null;

    function build() {
      if (tween) { tween.kill(); tween = null; }

      /* reset to a single set */
      Array.prototype.slice.call(track.children).forEach(function (child, i) {
        if (i >= originals.length) child.remove();
      });
      gsap.set(track, { x: 0 });

      var setCount = originals.length;
      var needed = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(track.scrollWidth, 1)) + 1);

      for (var c = 1; c < needed; c++) {
        originals.forEach(function (node) {
          var clone = node.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          track.appendChild(clone);
        });
      }

      /* distance of exactly one set, gap included */
      var first = track.children[0];
      var nextSetFirst = track.children[setCount];
      if (!nextSetFirst) return;
      var dist = nextSetFirst.offsetLeft - first.offsetLeft;
      if (dist <= 0) return;

      var dur = dist / speed;

      if (reverse) {
        gsap.set(track, { x: -dist });
        tween = gsap.to(track, { x: 0, duration: dur, ease: 'none', repeat: -1 });
      } else {
        tween = gsap.to(track, { x: -dist, duration: dur, ease: 'none', repeat: -1 });
      }

      ScrollTrigger.create({
        trigger: wrap,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: function (self) { self.isActive ? tween.play() : tween.pause(); }
      });
    }

    build();

    if (!isTouch) {
      wrap.addEventListener('mouseenter', function () { if (tween) gsap.to(tween, { timeScale: 0.25, duration: 0.4 }); });
      wrap.addEventListener('mouseleave', function () { if (tween) gsap.to(tween, { timeScale: 1, duration: 0.4 }); });
    }

    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(build, 220);
    });
  });

  /* ============================================================
     6. STATS — count up to the real figures
     ============================================================ */
  (function counters() {
    var band = document.querySelector('[data-counters]');
    if (!band) return;

    ScrollTrigger.create({
      trigger: band,
      start: 'top 82%',
      once: true,
      onEnter: function () {
        band.querySelectorAll('[data-count]').forEach(function (el) {
          var target = parseFloat(el.getAttribute('data-count'));
          var suffix = el.getAttribute('data-suffix') || '';
          var obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: function () {
              el.textContent = Math.round(obj.v).toLocaleString('en-US') + suffix;
            }
          });
        });
      }
    });
  })();

  /* ============================================================
     7. SECTION PARALLAX — rail band and season band drift slightly
        against the scroll so the page has depth without motion noise
     ============================================================ */
  if (!isNarrow) {
    gsap.utils.toArray('.season__grid, .lang-grid').forEach(function (el) {
      gsap.fromTo(el, { y: 26 }, {
        y: -26, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ============================================================
     8. FAQ — height-animated open/close on <details>
        Keeps native semantics (and the FAQPage schema match) while
        avoiding the browser's instant snap.
     ============================================================ */
  document.querySelectorAll('.qa').forEach(function (qa) {
    var panel = qa.querySelector('.qa__a');
    var summary = qa.querySelector('summary');
    if (!panel || !summary) return;

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (qa.open) {
        gsap.to(panel, {
          height: 0, opacity: 0, duration: 0.32, ease: 'power2.in',
          onComplete: function () { qa.open = false; gsap.set(panel, { height: 'auto', opacity: 1 }); }
        });
      } else {
        qa.open = true;
        gsap.fromTo(panel,
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.42, ease: 'power2.out' }
        );
      }
    });
  });

  /* recalc once webfonts settle so pinned/scrubbed positions stay true */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
