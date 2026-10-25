# Submission checklist and student review

Source: the official CSE513 Assignment 1 PDF, sections 3-8. The instructor requests **one PDF report**,
not two separate reports. A handwriting scan is not required. "By hand" means calculating the answers
before using the simulator; those calculations can then be typeset as tables and timelines.

## Website requirements

| Requirement | Implementation / evidence |
|---|---|
| FCFS, non-preemptive SJF, SRTF and RR | Pure motor, eight A/B reference cases and boundary tests |
| Add, edit and remove ID/arrival/burst | Editor and Playwright user flows |
| Algorithm and RR quantum selection | Automatic recalculation; q=1/2/4 shortcuts and custom integer input |
| Clear rejection of invalid input | Validation with stale-result removal |
| Load A and B | Library and quick buttons |
| Labeled Gantt, idle intervals, RR boundaries | CPU rail and Process lanes, Fit/Zoom, accessible interval labels |
| Arrival, burst, first start, completion, T/W/R | Process metrics table |
| Average T/W/R | Summary cards and comparison |
| Three additional tests with expected results | Idle, ties and preemption; additional-tests.md and unit tests |
| Five required invariants | 100 deterministic workloads across all four algorithms |
| Locally runnable source and README | pnpm install / dev / test / build |
| Public working website | Still pending; required before submission |

Extras include light/dark themes, full-width responsive layout, a first-use guide, Rules reference,
decision tracing, ready candidates, process highlighting, six presets, local named saves and JSON export.
A backend, login, Priority scheduling and paid hosting are not required.

## What each hand-worked example needs

A and B x FCFS/SJF/SRTF/RR = **eight examples**, RR q=2:

1. Input data: ID, arrival, burst, preserving input order.
2. A timeline naming every process and start/end boundary, including idle intervals.
3. First start, completion, turnaround, waiting and response for every process.
4. T=C-arrival, W=T-burst, R=firstStart-arrival calculations and their three averages.
5. A short explanation of important choices: preemption, ties and queue ordering.
6. Simulator output and a comparison; explain and resolve any discrepancy.

These eight examples were already solved with the student before implementation. They are preserved
in hand-calculations.md. The report generator reads those earlier references instead of calling the
motor to fabricate a "manual" answer. Each example includes an intermediate calculation. Rewriting
these on paper is not required by the supplied PDF; follow any separate instructor announcement.

## Remaining student review

- Trace Workload A at RR q=1 and q=4; explain the metric trade-offs in your own words.
- Check the three extra workloads and explain what each tests.
- Read the six analysis answers and AI-use statement; correct anything you cannot explain or endorse.
- Trace an unfamiliar small workload, following ready order, remaining work, first start and completion.
- Try both Gantt views, Rules, the guide, themes and saving/reloading a custom workload.
- Supply your name and student number for the local report only; these must not enter the public repo.

## One report, assembled in this order

1. Assignment heading; directly below it a clickable **working website URL**; repository link and identity.
2. Model, rules and verification approach.
3. Eight A/B examples: inputs, prior hand solution, current output and comparison.
4. Three additional tests, expected outcomes and invariant verification.
5. Six analysis answers, including an actual implementation mistake exposed by a test.
6. AI-use statement, limitations and reproducibility information.

The local review draft is output/pdf/CSE513-HW1-report-draft.pdf. Both output/ and .submission/ are
ignored by Git. It is not ready for submission until the following gates are satisfied.

## Release and submission gates

- [ ] Student has reviewed the implemented design and report text.
- [x] Current source, tests and English documentation are included in the local dev commit.
- [x] The student authorized commit/push; source changes were pushed to dev as `714177b`.
- [ ] CI has passed for the current commit; distinguish results for each OS.
- [ ] Website is published and accessible without signing in.
- [ ] A/B examples and asset loading are checked at the actual public address.
- [ ] The report's first-page clickable URL matches the verified live address.
- [ ] Name/student number appear only in the local PDF, not public code or the website.
- [ ] Draft/pending text is removed and the final PDF is visually reviewed.
- [ ] Student uploads the PDF to Microsoft Teams. An accessible repo link in the PDF replaces a ZIP.

The student reported an approximately eight-hour submission window on 25 October 2026. The official
PDF says "To be announced"; the instructor's Teams announcement is the definitive deadline source.
Publication and the final Teams upload are separate actions.
