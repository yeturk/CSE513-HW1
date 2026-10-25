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
- [x] Latest changes are included in the authorized local dev commit.
- [ ] A new push and publication are explicitly authorized; neither follows from commit permission.
- [ ] Current commit passes the configured Windows/macOS/Ubuntu CI matrix.
- [ ] A working public website is deployed and tested without signing in.
- [ ] Final PDF has the live link directly below the heading and local-only student details.
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

The official PDF says the deadline is "To be announced". The instructor's Teams announcement is
the definitive deadline source; the student reported an approximately eight-hour window on 25 October.
