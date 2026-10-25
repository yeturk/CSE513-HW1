# Additional test workloads

These cases were proposed with AI assistance and automated during implementation. Before submission,
the student should explain the decisions independently and adapt the cases if needed. Screenshots
alone are not the correctness evidence: the expected schedules and metrics are written below.

## 1. Initial and internal idle intervals

X(arrival=3, burst=1), Y(arrival=7, burst=2), RR q=2.
Expected for all four algorithms:

`Idle [0,3), X [3,4), Idle [4,7), Y [7,9)`

Both processes have W=R=0. Their turnaround times are 1 and 2. Average T/W/R = 1.5 / 0 / 0.
Checks: no execution before arrival; idle time before a process arrives does not count as its waiting.

## 2. Simultaneous arrivals and a selection tie

Input order: Z(arrival=0, burst=1), A(arrival=0, burst=1), RR q=2.
All four algorithms produce `Z [0,1), A [1,2)`.
Z: T=1,W=0,R=0. A: T=2,W=1,R=1. Averages = 1.5 / 0.5 / 0.5.
Checks: input order breaks the tie, not alphabetical process ID.

## 3. SRTF preemption

L(arrival=0, burst=5), S(arrival=1, burst=1).
SRTF: `L [0,1), S [1,2), L [2,6)`.
L: T=6,W=1,R=0. S: T=1,W=0,R=0. Averages = 3.5 / 0.5 / 0.
At t=1, S needs 1 unit, strictly less than L's 4 remaining units, so L is preempted.

## Boundary and regression cases

- SRTF: Z(0,2), A(1,1) -> Z [0,2), A [2,3). Equal remaining time does not preempt.
- RR: P1(0,4), P2(2,1), P3(1,1), q=2 -> queue at t=2 is P3,P2,P1.
- RR: Solo(0,4), q=2 -> Solo [0,2), Solo [2,4). Keep boundaries and do not requeue a finished job.
- SJF: Later(2,2), Earlier(1,2), Block(0,4) -> Block, Earlier, Later. Arrival precedes input order for a burst tie.
- Negative, fractional, empty or infinite times, empty/duplicate IDs and zero quantum are rejected.
- Workload A with P5(5,3), RR q=2 -> P1[0,2), P2[2,4), P3[4,6), P1[6,8), P4[8,9),
  P2[9,11), P5[11,13), P1[13,15), P5[15,16), P1[16,18). Average T/W/R = 9.6 / 6 / 2.6.

For Workload A with q=1, independently traced process order is
P1,P2,P1,P3,P2,P1,P4,P3,P2,P1,P2,P1,P1,P1,P1, one unit each.
Averages = 8.5 / 4.75 / 0.75. For q=4 the schedule is P1[0,4), P2[4,8), P3[8,10),
P4[10,11), P1[11,15); averages = 9.25 / 5.5 / 3.75. These extra expectations were traced
with AI assistance; they are not represented as already completed independent student exercises.

## Invariants and UI checks

A fixed-seed set of 100 workloads runs through all four algorithms. Each run checks burst conservation,
no execution before arrival, no overlap, nonnegative waiting/response and no idle time while work is
ready. Invariants alone do not prove scheduling-policy correctness; the eight prior manual references
and targeted boundary examples provide independent expectations.

Playwright checks input editing, automatic recomputation, both Gantt views, shared selection/zoom,
Rules and onboarding dialogs, tooltip keyboard access, theme persistence, saved-record recovery,
JSON export, font loading and responsive widths. OS-specific test evidence is recorded separately
from the CI matrix configuration in roadmap.md.
