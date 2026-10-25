# Application architecture

## Data flow

ProcessEditor -> validation -> simulate() -> current result -> Timeline / Results / Comparison.

The React interface does not make scheduling decisions. `src/domain/scheduler.ts` is independent
of the DOM, React and real time. Inputs are copied; original burst and remaining work are separate.
First start begins as null: zero is a valid time, so a truthiness check would be incorrect.

## Event-driven time

The motor jumps directly to meaningful events:

- FCFS/SJF: the selected process completes.
- SRTF: the next arrival or completion, whichever occurs first.
- RR: the quantum expires or the selected process completes.
- Empty ready queue: the next arrival, with an explicit idle segment in between.

Intervals are half-open: [start,end) supplies end-start CPU units. Continuous intervals for the same
process are merged in the FCFS/SJF/SRTF chart, while individual decisions remain available.
RR preserves every quantum boundary, including consecutive slices for the same process.

## Ties and ready queues

FCFS sorts by arrival, SJF by burst and SRTF by remaining work. Selection ties use arrival and then
original input index. SRTF's keep-running rule on equal remaining time takes precedence over ordinary
selection tie-breaking. RR uses a FIFO queue: admit arrivals through the boundary in arrival/index
order, then append the unfinished runner. A completed process is not appended.

Decision candidates describe the ready set immediately before selection, including the selected
process. Only the RR list is a FIFO queue. Other lists are policy-ranked candidates. Idle has no candidates.

## Result consistency and local state

The current result is derived with useMemo from process inputs, algorithm and quantum. Valid changes
recompute immediately; invalid inputs remove stale results. Decision/highlight state is scoped to the
input key and reset on edits. An open comparison is recalculated too. Invalid RR quantum suppresses
comparison without suppressing a valid non-RR primary result. JSON export contains only current data.

There is no backend. Reload restores the initial workload, while named saved copies can be selected
from the library. Browser records are versioned and validated for shape, identifiers, numeric limits
and algorithm before use. Malformed records are skipped. Storage-write failures never report success.
Theme preferences use optional localStorage; the initial preference follows the OS. Storage failures
do not disable the simulator. Changing theme preserves the result, selected decision and highlight.

## Timeline presentation

CPU rail is a compact single track. Process lanes uses a shared axis and separate rows for processes,
plus an idle row when needed. Faint lines span arrival to completion; colored blocks are execution;
uncovered parts of those lines are ready-queue waiting. Rows do not imply multiple CPUs.

Both views consume the same segments and decisions. The switch preserves zoom, selected decision
and process highlighting. View choice is held in App so it survives workload changes; new inputs
reset zoom to Fit. Every segment width remains duration / total duration. ResizeObserver measures
available chart width; crowded tick labels and block text are hidden without deleting boundary marks.
At high zoom, moving the decision cursor outside the visible range scrolls it into view.

Shared process highlighting connects all slices to the process metrics row. Decision selection and
process highlighting are distinct, so a reader may inspect one event while highlighting another job.

## Responsive layout, font and help

The workspace uses the available width rather than a fixed maximum. Below 960 px, settings and
results stack; from 1800 px, metrics and comparison can sit side by side. A mobile link jumps to results.
Averages follow the chart. Tables and zoomed charts scroll within their own containers.

Source Sans 3 is bundled through Fontsource as variable WOFF2 assets. The same font files are served
on Windows, macOS and Linux instead of relying on an OS-installed font. This avoids font substitution;
platform rasterization can still differ. The OFL license is preserved in public/fonts.

The first-use guide and Rules use native dialogs with keyboard focus management, Escape dismissal
and scrollable content. Rules appears between Getting started and the theme controls. ControlTooltip
uses one Radix provider and portaled content, preserving trigger DOM nodes and supporting disabled
controls, keyboard focus and viewport collision handling. No essential rule exists only in a tooltip.

Chromium scrollbars use an 8 px gutter and a 4 px visible thumb. A separate support condition applies
standard thin scrollbars to Firefox without overriding Chromium pseudo-element styling. The input
remove column includes its button and cell padding, avoiding unnecessary horizontal overflow.

## Verification invariants

- A process's total execution duration equals its burst.
- First start equals its earliest execution interval; completion equals its final endpoint.
- The timeline is contiguous from zero to completion; idle intervals are explicit.
- Processes never run before arrival or overlap on the single CPU.
- Waiting and response are nonnegative; ready work prevents idle time.
- Average turnaround minus average waiting equals average burst.

Independent schedule expectations check policy correctness in addition to these invariants.
