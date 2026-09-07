# Kanyaka Bank — build notes

```
index.html
css/style.css
js/main.js
assets/kanyaka-logo.png   ← placeholder, replace with the real mark
```

No build step. Open `index.html`, or serve the folder with any static server.
Bootstrap 5.3, Bootstrap Icons and Mukta load from CDN.

---

## 1. Preloader

Full-screen crimson panel, centred emblem, then the wordmark fills letter by
letter from left to right. Runs about 1.9 s.

Two constants at the top of `js/main.js`:

```js
var PRELOADER_ONCE_PER_SESSION = false;  // true = first page of a tab only
var PRELOADER_MIN_MS = 1900;             // floor, so the wordmark finishes
var PRELOADER_MAX_MS = 5000;             // ceiling, even if an asset hangs
```

It clears on whichever comes first: `window.load` plus the minimum, or the
ceiling. A hung font or image cannot leave the page stuck behind it. Under
`prefers-reduced-motion` it never appears.

To change the wordmark, edit `.kb-pre-word` in `index.html`. Each letter is its
own `<span>` carrying a `data-letter` attribute — the attribute is what the
solid overlay renders, so both must match. The stagger is a list of
`nth-child` delays in section 2 of the stylesheet; add or remove lines to match
the letter count.

## 2. Structure

Follows the PDP layout, in order: utility bar with live clock → header →
hero → what's-new ticker → banking services → financial strength → about →
notices and awareness poster → mobile app → product range → deposit rates →
EMI calculator → safe-banking strip → help band → footer → fixed action rail.

The rates table and EMI calculator are kept from the earlier build. Everything
above and below them is new.

**Services and product range** are CSS scroll-snap rails rather than a JS
carousel. Native scrolling means touch, trackpad, arrow keys and the buttons
all work, and there is no plugin to keep in sync. The product rail collapses to
a plain four-column grid at ≥1200px, where all four fit anyway.

## 3. Content that still needs real data

Placeholders are marked in the markup. Nothing here should ship as written.

- Phone `07172 250 000`, email `care@example.com`, the Gandhi Chowk address
- Registration no., RBI licence no., IFSC prefix, PAN, GST in the footer
- Financial-strength figures (currently PDP's numbers as shape-fillers)
- Branch count, founding year, district list in the About section
- Visitor count in `[data-kb-visits]` — needs a server-side value
- The DICGC QR is a decorative pattern, not a scannable code

The language switcher changes its own label and fires a `kb:language` event.
Wiring it to real translations is still to do:

```js
document.addEventListener('kb:language', e => console.log(e.detail.lang));
```

## 4. Content that changed from the previous version

The old copy said Vijayawada, Andhra Pradesh, Telugu and APSPDCL, which
contradicted the Marathi logo. It now reads Chandrapur, Maharashtra, Marathi
and MSEDCL throughout. Check every one of those against the client before
launch.

## 5. Fixes carried in from the review

- `calss` typo gone; logo sized by height with `width`/`height` attributes
- Logo has a real `alt`, and the brand link has an accessible name
- Asset paths are relative, so a subpath deploy works
- `--kb-header-h` is measured from the live header, so anchor offsets are
  right at every breakpoint
- Hover dropdowns go through Bootstrap's own instance, so hover and click no
  longer disagree
- Carousel has a pause button, pauses on keyboard focus, and inactive slides
  are `inert` so screen readers read one slide at a time
- EMI figures update on drag; the spoken announcement waits for release
- Rate table extends to 10 years, matching the product copy
- Marcellus dropped — Mukta carries both Devanagari and Latin, so Marathi copy
  sets in the same family and one font request goes away

## 6. Responsive behaviour

| Width | What changes |
|---|---|
| <576 | Rails show one card at 80vw; buttons go full width |
| <768 | Rates table stacks into labelled rows; utility bar centres |
| <992 | Hero artwork hidden, controls move below the slide; action rail becomes a bottom bar |
| <1200 | Navbar collapses (seven items plus two buttons need the room) |
| ≥1200 | Product rail becomes a static four-column grid |

## 7. Still worth doing

- Subset Bootstrap Icons. The full webfont is ~90 KB of CSS plus font files for
  roughly 40 glyphs; inline SVGs would cut most of it.
- Swap the CSS gradient tiles in the service and product cards for real
  photographs. Each has its own class (`.kb-svc-media-1` … `-6`,
  `.kb-prod-media-1` … `-4`) — set `background-image` and they take over.
- Add the pages RBI expects a UCB site to carry: named grievance officer,
  deposit policy, customer rights policy, service charges, branch locator.
