# AI assistance record - review draft

This record supports the final report's AI-use statement. The student must review it and confirm that
it accurately describes the work and their understanding before submission.

## Tools and purposes

- **Codex:** assignment review, concept explanations, guided hand-calculation practice, checking the
  student's metric calculations, React/TypeScript implementation, tests, documentation and PDF draft.
- **Claude Code CLI / frontend-design:** advice on layout, typography, color, accessibility and interaction.
  These consultations had no file-editing tools or Git permissions. The skill text was included in the prompt.

## Verification

- Workloads A and B were solved with the student before implementation.
- Eight prior schedules, first-start/completion times and averages became independent golden tests.
- Additional workloads cover idle time, ties, preemption and RR boundary ordering.
- Invariants run on 100 deterministic workloads across all four algorithms.
- Type checking, production builds and browser tests verify implementation and user flows.
- Desktop/mobile screenshots and rendered report pages were inspected visually.
- The report exporter reads prior hand-calculation notes independently of simulate(), compares every
  interval and process metric with current output, and fails if they disagree.

## Corrected or rejected AI suggestions

An early Claude brief gave Workload B's second idle interval as **5-8**. The early jobs actually
finish at t=6, so the correct interval is **6-8**. The hand calculation was retained. The same brief
omitted first start from the metric columns; the assignment requires it, so it was included.

A later consultation suggested breaking ties by arrival and then process ID. The assignment instead
requires arrival and then **input-list order**. That suggestion was rejected; the Z/A test specifically
protects against alphabetical ordering. Hiding quantum outside RR was also rejected because the
comparison panel still needs its RR configuration.

## Actual implementation bugs exposed by tests

The first mobile test measured 533 px of page width in a 390 px viewport. A CSS grid track retained
its minimum content width. Using minmax(0,1fr), shrinkable panels and internal table/chart scrolling
fixed it; the same test then passed.

Later, the input table's remove column was narrower than its button plus cell padding, creating an
unnecessary horizontal scrollbar. Widening that column fixed actual overflow rather than hiding it.
A test now checks horizontal overflow with both a small and a large number of rows.

A mockup select had an ambiguous accessible label. Explicit labeling corrected the failing interaction
test. The hover/focus tooltip tests also verify that adding help does not swallow button clicks.

## Student review still required

AI-generated code does not establish that the student can independently explain every part of it.
The motor, unfamiliar workload tracing, RR q=1/2/4 analysis and final report need student review.
The additional q=1/q=4 expectations were independently traced with AI assistance and then tested;
the student is not claimed to have already completed those extra calculations alone.
No scheduling bug that did not occur is described as a personal debugging experience.
