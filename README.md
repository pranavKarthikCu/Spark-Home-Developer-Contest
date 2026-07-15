# Spark Homes — Repair Cost Estimator

A single-file, offline-first Progressive Web App for field agents to build repair cost
estimates during property walkthroughs — built for the Spark Homes Developer Contest.

No build step, no server, no framework. Open the HTML file and it runs.

---

## Running it locally

There is no install step and no dependencies to fetch.

**Option A — just open the file**
Double-click `spark-homes-estimator.html`, or open it in a browser via `File > Open`.
This works for using the app itself. The one thing it *won't* do from a raw `file://`
URL is register the service worker or qualify as an installable PWA — browsers require
a real HTTP(S) origin (or `localhost`) for those two APIs specifically.

**Option B — serve it locally (to test the PWA/offline/install behavior)**
From this folder, run any static file server, e.g.:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000/spark-homes-estimator.html`. From a real `http://`
origin the service worker registers, the app becomes installable ("Add to Home
Screen" on iOS/Android), and it will continue working with the network off.

No `npm install`, no build tooling, no environment variables — the two files in this
repo are the entire app.

---

## Approach

The brief asked for a single self-contained HTML file that still needed to behave like
a real installable, offline-capable app. Those two constraints pull in opposite
directions — "single file" wants everything inlined, "installable PWA" requires a
service worker, which by spec has to be its own script resource, not something you can
inline into the page it controls. `spark-homes-estimator.html` and `service-worker.js`
are the two files that constraint produces: literally everything else (JSZip, SheetJS/
XLSX, jsPDF, anime.js, the web app manifest, and the app's icons) is base64-embedded
directly in the HTML, so there is zero CDN dependency and zero network requirement
after the first load.

The data model is intentionally simple: one `localStorage` key holds every project.
Each project has a fixed "house-wide" room (Interior/General, Systems & Structure,
Exterior) plus however many Bathroom/Kitchen/Bedroom/Living instances the agent adds
during the walkthrough. Bedroom and Living rooms get their *own* Flooring/Paint/Doors
group instances rather than sharing one global bucket — so "Bedroom 1: Flooring" and
"Bedroom 2: Flooring" are tracked completely independently, which is what actually
matches how an agent walks a house room by room.

## Libraries used

All bundled inline (no CDN, no network calls):

| Library | Purpose |
|---|---|
| [JSZip](https://stuk.github.io/jszip/) | Packages the Excel file + photos into one downloadable ZIP |
| [SheetJS (xlsx)](https://sheetjs.com/) | Generates the `.xlsx` cost breakdown |
| [jsPDF](https://github.com/parallax/jsPDF) | Generates the client-facing PDF estimate |
| [anime.js](https://animejs.com/) | Landing page logo animation |

Everything else — the estimator logic, room/group model, PDF export layout, Deal
Analyzer, photo-based measuring tool, price override system — is vanilla JS/HTML/CSS
with no framework.

## Feature summary

- Multiple projects, each with its own rooms, repair selections, quantities, photos
- 108 repair line items across 5 sections / 19+ groups, sourced from the provided
  pricing list, with a "No Action Needed" toggle per group
- Adjustable room support — add/remove Bathroom, Kitchen, Bedroom, Living instances
  freely; each gets its own scoped groups
- Per-project price override on any line item, plus a global pricing update via CSV
  upload
- Add/remove custom line items per room
- Progress tracking (per group, across all rooms in the project)
- Photo capture with camera `capture` attribute for reliable mobile use, per-photo
  notes, and a best-effort serial-number auto-detect (native `TextDetector` API where
  supported, silently no-ops elsewhere and falls back to manual entry)
- A reference-object measuring tool (see writeup — WebXR AR isn't available on iOS
  Safari, so this uses a known-length-reference technique instead, which works
  identically on any device)
- Export: ZIP containing the Excel breakdown (with per-room subtotals and a Group
  column) and all photos, downloads automatically
- Native OS share sheet (`navigator.share`) with the ZIP attached where supported,
  plus a standalone PDF export and direct ZIP download as fallbacks
- Deal Analyzer — profit margin / 70% Rule calculator wired directly to the live
  repair total (see the PDF writeup for the full rationale)
- Installable PWA: web app manifest + service worker, offline-capable after first load

## What AI tools did in this project

This was built end-to-end in conversation with Claude (Anthropic), including
architecture decisions, implementation, debugging real device issues from screenshots
and console output, and functional testing before each change shipped. See the PDF
writeup for specifics on where that testing did and didn't catch real bugs.
