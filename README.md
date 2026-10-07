# guruiptvs.net — landing page

Static landing page for Guru IPTV (Indian IPTV, USA & Canada market).

No framework, no build step, no bundler. Hand-authored HTML + one stylesheet +
one JS module, with GSAP from CDN. That's a deliberate choice: the LCP element is
plain HTML, there's no hydration cost, and it deploys to any static host or
straight into the existing hosting by copying the files up.

```
index.html                 the page (inline JSON-LD at the bottom)
assets/css/styles.css      all styling + reduced-motion fallbacks
assets/js/motion.js        GSAP / ScrollTrigger motion layer
assets/img/*.svg           logo mark, lockup, favicon
robots.txt                 incl. explicit AI-crawler allowances
sitemap.xml
llms.txt                   AEO/GEO summary for answer engines
.claude/launch.json        local preview server (python http.server :8899)
```

## Local preview

```bash
python -m http.server 8899
```

Then open http://localhost:8899.

## Motion

GSAP + ScrollTrigger handle anything scroll-linked or continuous; CSS handles
hovers and simple fades.

- **Hero** — a scrubbed cinematic pull-back: opens hard on the TV screen
  (`transform-origin` locked to the screen centre) and scales out to the full
  room. Pinning is CSS `position: sticky`, **not** a ScrollTrigger pin — no
  pin-spacer, no measured inline sizes, no layout shift, and it stays smooth on
  mobile. ScrollTrigger drives only the scrub.
- **Marquees** — duplicated tracks with the loop distance measured off the DOM
  (so the seam is exact regardless of flex `gap`). Paused when offscreen and
  slowed on hover.
- **Feature rows** — clip-path mask wipe + inner scale + light parallax.
- **Everything is transform/opacity only.** No layout-triggering properties.

### Graceful degradation

- `prefers-reduced-motion: reduce` → `motion.js` no-ops entirely and the page
  renders as a static document (hero becomes a normal full-height block).
- GSAP fails to load → the `js-motion` class is stripped and all reveal entry
  states are dropped, so content can never be left invisible.
- No JS at all → same as above; the `js-motion` class is never added.

The `js-motion` class is set by a tiny inline script in `<head>` so reveal states
never flash before first paint.

## Placeholders to wire in

All marked with `data-placeholder` attributes — grep for them.

| What | Where | Current value |
|---|---|---|
| Phone | `data-placeholder="phone"` | `tel:+10000000000` |
| WhatsApp | `data-placeholder="whatsapp"` | `https://wa.me/10000000000` |
| GHL form | `data-placeholder="ghl-form"` | dashed `.form-holder` block in the CTA band |

Also update the `contactPoint.telephone` in the Organization JSON-LD.

For the GHL embed: give the iframe a fixed height so it doesn't cause layout
shift, and add `loading="lazy"`.

## Structured data

One `@graph` block covering Organization, WebSite, WebPage, BreadcrumbList,
Product (with four Offers), and FAQPage. The FAQPage answers are kept in sync
with the visible FAQ copy — **if you edit one, edit both**, or the markup
stops matching the page and Google drops the rich result.

A `VideoObject` node is present but **commented out**. It needs a real video file
at `assets/video/guru-iptv-overview.mp4` plus a thumbnail. Don't uncomment it
before those exist — Google flags a `VideoObject` whose `contentUrl` doesn't
resolve.

## Pricing

`$79 / 6mo`, `$120 / 1yr`, `$220 / 3yr`, `$330 / 5yr` (USD).

Taken from the published plan ladder on guruiptv247.com and guruiptvs.xyz —
the current guruiptvs.net has no price grid (its `#pricing` anchor points at a
competitor comparison table). Prices appear in **three** places: the pricing
cards, the FAQ answer, and the Product Offers in JSON-LD. Change all three.

## Content rules this page follows

No invented testimonials, customer counts, ratings, review totals or awards.
The stats band carries product specs only. No third-party network logos and no
fake show/movie posters — the marquee is typographic and the rail uses original
category artwork.

## Open items

- **Typeface** — currently Bricolage Grotesque + Instrument Sans. Being changed;
  swap the two `--f-display` / `--f-text` tokens in `styles.css` and the Google
  Fonts `<link>` in `index.html`.
- **Imagery** — the hero scene, feature-row art and rail tiles are currently
  hand-authored inline SVG. Being replaced with generated images.
