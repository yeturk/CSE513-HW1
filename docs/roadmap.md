# Work plan and verification status

## Completed

- [x] Read the official assignment and scheduling rules.
- [x] Review ready queues, bursts, preemption and turnaround/waiting/response.
- [x] Solve A and B with the student for all four algorithms, RR q=2, before implementation.
- [x] Build the independent motor, input validation and React/TypeScript/Vite interface.
- [x] Add decision tracing, idle intervals, RR boundaries, CRUD, metrics, comparison and JSON export.
- [x] Check eight independent reference examples, additional workloads and invariants.
- [x] Add English UI, light/dark themes, automatic recalculation and invalid-input empty states.
- [x] Add Fit/Zoom, shared process highlighting and q=1/2/4 shortcuts.
- [x] Implement a full-width responsive layout, onboarding and browser-local workload saves.
- [x] Add six presets, safe saved-record recovery, slim scrollbars and control tooltips.
- [x] Integrate the selected CPU rail and Process lanes designs in the main simulator.
- [x] Add Rules between Getting started and the theme controls.
- [x] Bundle Source Sans 3 instead of depending on an OS-installed font.
- [x] Prepare English repository documentation and an English PDF review draft.
- [x] Create the public source repository and perform the originally authorized initial push.

## Student review and delivery still pending

- [ ] Student can explain the motor and trace an unfamiliar workload independently.
- [ ] Student reviews RR q=1/2/4 analysis, additional cases, six report answers and the AI statement.
- [ ] Student approves the final design and report text.
- [x] Commit and push of the selected Inspector, screenshot requests and review fixes are authorized.
- [x] Website publication was explicitly authorized after the random-process update.
- [x] Published application commit `e82fbe5` passes Windows/macOS/Ubuntu CI.
- [x] A working public website is deployed and tested without signing in.
- [x] The PDF review draft has the live link directly below the heading and local-only student details.
- [ ] Final PDF is visually checked and uploaded to Teams by the student.

## Evidence and its limits

The initial commit passed [Ubuntu CI](https://github.com/yeturk/CSE513-HW1/actions/runs/40193980656).
That historical result does not verify the current local changes.

Before the final font/view/Rules integration, 47 unit tests and a production build passed locally.
Of 31 browser scenarios, 30 passed initially; an accessible select label was corrected and the
remaining scenario passed in a targeted rerun. The visual mockup check was also rerun.
The report exporter matched every interval and process metric for all eight prior manual examples.

Final local verification on 25 October 2026: all 47 unit tests and all 36 Playwright scenarios
passed, along with TypeScript checking, the production build and verification of all eight manual
examples. New browser checks cover view switching, lane proportions, idle rows, Rules keyboard/focus
behavior and locally loaded Source Sans 3. Desktop and mobile screenshots were inspected in both
themes. Local browser tests ran on Windows with Microsoft Edge; configuring other OS jobs is not
evidence of executing those jobs.

After the student pushed `5f96f6f`, [the three-OS CI run](https://github.com/yeturk/CSE513-HW1/actions/runs/40199282664)
passed on Ubuntu and Windows. macOS passed unit tests and the build but failed one of 36 browser tests:
the zoomed lane cursor was outside the measured chart bounds. This is not an all-platform pass.

Local follow-up changes explain both views and Rules in Getting started, check every guide step
at 320 x 568, and make the cursor test wait for the chosen decision and measure both rectangles
in one browser evaluation. The visibility requirement is preserved. Four affected scenarios passed
three repetitions each in Windows Chromium (12 passes); the guide build also passed. These follow-up
changes are included with the authorized cursor-fix commit. The next design revision awaits the student's Stitch selections.

A deterministic regression that withholds timeline ResizeObserver notifications reproduced an
offscreen cursor in the old implementation: scrolling used cached canvas width. The correction
reads committed layout width in the layout effect and includes the sticky lane-label gutter in
the scroll inset. Returning to the first decision now also returns to the timeline origin.
The old implementation failed the regression; the correction passed both cursor scenarios three
times each. Full Windows Chromium verification then passed all 47 unit tests, 37 browser tests,
TypeScript checking and the production build. This demonstrates the delayed-measurement fix,
but does not yet establish that it resolves the original macOS CI failure. A new macOS run is required.

The subsequent [CI run for `127ac66`](https://github.com/yeturk/CSE513-HW1/actions/runs/40200045316)
completed successfully on Windows, macOS and Ubuntu. The macOS log confirms 47 unit tests and 37
browser tests passed, including the original failing cursor scenario and the new regression.

The student then selected only the Decision Inspector and queue presentation from the Stitch
reference. These local changes separate the inspector into a card with interval, selection rationale
and boundary outcome sections. RR uses FIFO arrows; other algorithms show ready candidates without
FIFO arrows. Three new browser scenarios verify RR order/outcomes, idle states, SRTF semantics and
layout at 320/390/1024/1920 px in both themes. All 40 browser tests and the production build passed
locally. At that stage these visual changes were not committed or pushed; the three-OS result above
applies to the cursor-fix commit, not the subsequent design revision.

The next revision adds sortable process metrics (descending first, ascending toggle and restore input
order), a precisely defined zero-cost context-switch count, and the selected Inspector changes.
It also addresses the remaining Claude review findings: disabled-control semantics, a shared lane
gutter constant, portable bundled PDF fonts, actionable report-data errors and independently asserted
additional report references. Local Windows verification passed 56 unit tests, 43 Playwright scenarios,
TypeScript checking and the production build. The exporter verified all eight prior examples and all
three additional references. Negative tests reject missing/changed references and mismatched report
data. The PDF was rendered and inspected. CI now also builds this report on all three operating systems;
the historical CI result above does not verify these new changes.

The authorized source changes were committed and pushed to dev as `714177b`. The automatically
triggered [verification run](https://github.com/yeturk/CSE513-HW1/actions/runs/40201756244) checks this
revision. Check the run conclusion before treating it as cross-platform evidence. Website publication
remains a separate pending step.

Random-process release: each click adds one editable job, with arrival in 0..floor(1.5 x max arrival)
and burst in 1..2 x max burst. Empty workloads, invalid input, unique IDs and simulator capacity have
explicit handling. Getting started and README explain the behavior. Local verification passed 62
unit tests, 46 browser tests and the production build. The anonymous-release verification script
passed against the local server, comparing all eight independent A/B schedules and tables.
The new CI and Pages workflow results must be checked for this release before treating it as live.

Release evidence for `e82fbe5`: [CI run, attempt 2](https://github.com/yeturk/CSE513-HW1/actions/runs/40202772273)
passed on all three operating systems with 62 unit and 46 browser tests. The first Windows attempt
had one blank-page timeout: its trace recorded Chromium `ERR_NO_BUFFER_SPACE` when loading
`src/main.tsx`. Only that failed OS job was rerun, without changing code or relaxing assertions;
all 46 scenarios then passed. Ubuntu and macOS passed on the first attempt.

[Pages publication](https://github.com/yeturk/CSE513-HW1/actions/runs/40203603300) succeeded for the
same commit. An anonymous browser checked https://yeturk.github.io/CSE513-HW1/: every A/B schedule
and per-process metric table matched the independent references. Random addition, both timeline
views, dark theme, mobile width, bundled fonts and asset responses passed. The production build
also passed the same check locally. This is browser/software evidence, not a test of Ubuntu's actual
kernel scheduler. Student report review and final Teams submission remain pending.

## Final report verification

The final local submission report uses Calibri, matching the assignment, and has eight pages.
It includes explicit behavior statements for all three additional tests, corrected section numbering
and no review-draft banner. Identity and the generated PDF remain in ignored local directories.
The generator validates page count before writing; a forced ten-page regression check confirmed
that an existing output is preserved on failure. Portable CI generation uses a separate, clearly
labeled Vera preview and does not require private metadata or licensed system fonts.

The final Claude review found no scheduling or metric error. Separate anonymous browser captures
covered eight A/B cases, the three additional tests and Workload A RR q=1/q=4. All 13 matched an
independent unit-time scheduler and the final report's numerical content. Both first-page links
were checked. All eight final pages were rendered and inspected. The 62 unit tests passed again;
this report-only revision does not change the application or the previously published site.
Tracked files and reachable history were scanned for student metadata, credentials and private
paths, with no matches in that audit. This is bounded pattern-based evidence, not a guarantee for
every possible secret format. Final student review and the Teams upload remain student actions.

The official PDF says the deadline is "To be announced". The instructor's Teams announcement is
the definitive deadline source; the student reported an approximately eight-hour window on 25 October.
