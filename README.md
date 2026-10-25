# Scheduling Lab - CSE513 HW1

An interactive CPU scheduling lab built with React, TypeScript and Vite. Compare FCFS,
non-preemptive SJF, SRTF and Round Robin, inspect every decision, and check per-process metrics.

**Repository:** [yeturk/CSE513-HW1](https://github.com/yeturk/CSE513-HW1), development branch `dev`.
**Delivery status:** the application and report review draft are available locally. Public deployment,
the live website link, student details and final report review are still pending. A source repository
link does not replace the required working website address.

## Quick start

Use Node.js 24 and pnpm 10.34.5 (minimum supported Node version: 22.12.0).

```sh
npm install --global pnpm@10.34.5
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by Vite, normally `http://127.0.0.1:5173`.
The same browser-based model runs on Windows, macOS and Linux. No backend, database, login,
API key or paid service is required. Source Sans 3 is bundled as WOFF2 web fonts; the visitor
does not need to install the font or contact a font CDN. Its OFL license is included in `public/fonts/`.

## Using the lab

1. Start with **Getting started**, or reopen the guide from the header. **Rules**, between the guide
   and theme controls, explains the model, tie-breaking, RR boundaries, metrics and limits.
2. Load Workload A/B, select a learning preset, or add/edit/remove processes. Input order matters.
3. Select an algorithm. RR accepts any valid integer quantum, with shortcuts for 1, 2 and 4.
4. Results update automatically. Invalid inputs clear affected results instead of leaving a stale chart.
5. Switch between **CPU rail** (a compact single track) and **Process lanes** (one row per process).
   Both use one shared clock and one CPU. In lanes, a faint line spans arrival to completion;
   colored blocks show CPU service and gaps along the line show ready-queue waiting.
6. Select a slice or use Previous/Next and the decision slider to inspect ready candidates and reasons.
   The view switch preserves the selected decision, process highlight and zoom. The chosen view
   survives workload changes; a new input resets exploration to its first decision and Fit zoom.
7. Select a process label to highlight all its slices and its metrics row. **Clear highlight** resets it.
8. Use **Fit** or zoom (100%-1600%) to inspect short slices. Time proportions remain unchanged.
   Narrow labels are suppressed to avoid overlap; exact intervals remain in accessible names,
   hover titles and the decision panel. Scrollbars are slim; tables scroll inside their own panels.
9. Read the average turnaround/waiting/response cards below the timeline, then **Compare algorithms**.
   An open comparison recalculates when inputs or quantum change. **Export results** downloads JSON
   containing the current result and, if open and valid, the current comparison.
10. Choose **Light / Dark**. The first visit follows the system preference; an explicit choice is saved.

Hover or keyboard-focus controls for tooltips. The question-mark buttons explain input fields
and metrics. Tooltips can be dismissed with Escape; disabled controls have focusable explanations.

### Workloads and local saves

The library contains six presets: A, B, idle intervals, simultaneous arrivals/ties, SRTF preemption,
and an RR boundary example. Learning presets select their relevant policy and q=2. A/B shortcuts
keep the currently selected algorithm and quantum.

Under **Save or manage workloads**, enter a name and choose **Save copy**. Up to 12 named copies
store inputs, algorithm and quantum in this browser. They can be reloaded from the library after a
page refresh. Existing names are not overwritten. **Remove saved copy** removes the stored record
but keeps the current inputs. Clearing browser data removes these saves. Export JSON for a portable
record; JSON import is not implemented. Storage failures are reported rather than treated as success.

An invalid RR quantum hides RR results and comparison. Valid FCFS/SJF/SRTF results can remain,
because those policies do not use quantum. Displayed decimal values use English formatting.

## Model and scheduling rules

- One CPU, one CPU burst per process, no I/O, zero context-switch cost.
- Arrivals are nonnegative integers; bursts and quantum are positive integers.
- IDs are trimmed, case-sensitive and unique.
- Selection ties prefer earlier arrival, then earlier position in the input list.
- SRTF preempts only for a strictly shorter remaining time; equal remainders keep the current job.
- RR admits arrivals at a quantum boundary before returning the unfinished runner to the queue.
- Completed processes never rejoin the queue. Consecutive RR slices are never merged.
- Intervals are `[start, end)` and provide `end - start` CPU units.
- Turnaround = completion - arrival; waiting = turnaround - burst; response = first start - arrival.
- Idle intervals are shown explicitly, including time before the first arrival.

This models scheduling policies, not Ubuntu's actual scheduler or real process execution.

## Verification

```sh
pnpm test          # Prior hand calculations, boundaries and invariant checks
pnpm typecheck     # TypeScript validation
pnpm build         # Type checking and production assets in dist/
pnpm preview       # Serve the production build locally
pnpm exec playwright install chromium
pnpm test:e2e      # Browser interactions and responsive layout
```

To use installed Microsoft Edge on Windows:

```powershell
$env:E2E_BROWSER_CHANNEL = 'msedge'
pnpm test:e2e
```

See [verification status](docs/roadmap.md) for evidence and its limits. CI is configured for Windows,
macOS and Ubuntu, but a configured matrix is not evidence that the latest commit passed on each OS.

## Project structure

```text
src/domain/         Pure scheduling motor, types, presets, saved-record validation
src/components/     Editor, timeline views, results, guide, rules and tooltips
src/App.tsx         Current-input calculation and shared UI state
src/styles.css      Responsive light/dark styles
public/fonts/       Bundled font license
tests/unit/         Independent schedule expectations and boundary checks
tests/e2e/          Playwright user flows, accessibility and responsive checks
docs/               Architecture, manual references, tests, AI log and delivery checklist
scripts/            Local report verification/export and PDF draft generation
.github/workflows/  Verification and manually dispatched Pages publication
```

## Report preparation

[Submission checklist](docs/submission-checklist.md) maps the assignment to deliverables.
`node scripts/export-report-data.mjs` reads the eight prior hand calculations, compares them with
current simulator output, and writes `output/report-data/results.json`. `scripts/build-report.py`
uses Python, ReportLab and Windows Arial fonts to create the English review PDF. These optional
report tools are not required to run the simulator. Poppler or pypdfium2 can render the PDF for review.

Personal report metadata belongs only in the ignored `.submission/metadata.json`, using `name`,
`studentNumber` and `website`. Generated `output/` files and this private folder are not committed.
The report remains a draft until the live link, student information and review are complete.

## Limits

Up to 64 processes, 24 characters per ID, maximum arrival plus total burst of 1,000,000 units,
and at most 2,000 RR slices. Limits produce explicit errors. Process colors repeat after eight IDs;
text labels still identify each process. Only displayed averages are rounded, to at most three decimals.

## Publishing

The public repository contains the source. GitHub Pages can host the built application.
`ci.yml` runs on pushes/PRs. `pages.yml` runs only when manually dispatched; it does not publish
on a normal push. Enable Settings > Pages > GitHub Actions, then dispatch **Publish website (manual)**
after the release is approved. Verify the returned website address without signing in.
Vite's `base: './'` generates relative assets suitable for a repository subpath.

Course PDFs and slides remain local and ignored. Student numbers and other private information
must not appear on the public website or in committed sources.

## References

- [Official assignment PDF](https://mehmetgokturk.com/cse513/materials/assignment01/CSE513-Assignment-1.pdf)
- [Course website](https://mehmetgokturk.com/cse513/index.html)
- [Source Sans 3](https://github.com/adobe-fonts/source-sans)
- [AI assistance and verification](docs/ai-use.md)

The earlier design alternatives remain available at `/?preview=gantt` for reference; A and B are
integrated into the main application. That preview does not change simulation policies.
