# Prior hand-calculated references

These examples were solved step by step with the student before the simulator was implemented.
They were transferred from that earlier work, not derived from the simulator. Eight golden tests
in tests/unit/scheduler.test.ts compare the motor against these independent expectations.

S = first start, C = completion, T = turnaround, W = waiting, R = response.
For every process: T = C - arrival, W = T - burst, R = S - arrival.
Time is expressed in abstract simulation units. Round Robin uses quantum = 2.

## Workload A inputs

| ID | Arrival | Burst |
|---|---:|---:|
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 2 |
| P4 | 4 | 1 |

### A — FCFS

Timeline: P1 [0,8), P2 [8,12), P3 [12,14), P4 [14,15).
Processes arriving while P1 runs wait in arrival order. A shorter burst does not change FCFS order.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 8 | 8 | 0 | 0 |
| P2 | 8 | 12 | 11 | 7 | 7 |
| P3 | 12 | 14 | 12 | 10 | 10 |
| P4 | 14 | 15 | 11 | 10 | 10 |
| Average | | | 10.5 | 6.75 | 6.75 |

Worked calculation for P2: T = 12−1 = 11, W = 11−4 = 7, R = 8−1 = 7.

### A — SJF

Timeline: P1 [0,8), P4 [8,9), P3 [9,11), P2 [11,15).
Only P1 is ready at t=0; later short jobs cannot interrupt it.
At t=8, the ready bursts are ordered P4(1), P3(2), P2(4).

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 8 | 8 | 0 | 0 |
| P2 | 11 | 15 | 14 | 10 | 10 |
| P3 | 9 | 11 | 9 | 7 | 7 |
| P4 | 8 | 9 | 5 | 4 | 4 |
| Average | | | 9 | 5.25 | 5.25 |

Worked calculation for P3: T = 11−2 = 9, W = 9−2 = 7, R = 9−2 = 7.

### A — SRTF

Timeline: P1 [0,1), P2 [1,2), P3 [2,4), P4 [4,5), P2 [5,8), P1 [8,15).
At t=1, P2(4) is shorter than P1 remaining(7). At t=2, P3(2) is shorter than P2 remaining(3).
At t=4, P3 has already completed; P4(1) is selected. This is not a preemption.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 15 | 15 | 7 | 0 |
| P2 | 1 | 8 | 7 | 3 | 0 |
| P3 | 2 | 4 | 2 | 0 | 0 |
| P4 | 4 | 5 | 1 | 0 | 0 |
| Average | | | 6.25 | 2.5 | 0 |

Worked calculation for P1: T = 15−0 = 15, W = 15−8 = 7, R = 0−0 = 0.
Even with zero response time, later ready-queue waits contribute to waiting time.

### A — RR, q=2

Timeline: P1 [0,2), P2 [2,4), P3 [4,6), P1 [6,8), P4 [8,9),
P2 [9,11), P1 [11,13), P1 [13,15).
The queue at t=2 is P2,P3,P1; at t=4 it is P3,P1,P4,P2.
The final two P1 quanta remain separate.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 0 | 15 | 15 | 7 | 0 |
| P2 | 2 | 11 | 10 | 6 | 1 |
| P3 | 4 | 6 | 4 | 2 | 2 |
| P4 | 8 | 9 | 5 | 4 | 4 |
| Average | | | 8.5 | 4.75 | 1.75 |

Worked calculation for P2: T = 11−1 = 10, W = 10−4 = 6, R = 2−1 = 1.
Waiting intervals are [1,2) and [4,9): 1+5=6.

## Workload B inputs

| ID | Arrival | Burst |
|---|---:|---:|
| P1 | 2 | 3 |
| P2 | 2 | 1 |
| P3 | 8 | 2 |
| P4 | 9 | 1 |

### B — FCFS

Timeline: Idle [0,2), P1 [2,5), P2 [5,6), Idle [6,8), P3 [8,10), P4 [10,11).
P1 and P2 arrive simultaneously, so input order breaks the tie.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 2 | 5 | 3 | 0 | 0 |
| P2 | 5 | 6 | 4 | 3 | 3 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Average | | | 2.75 | 1 | 1 |

Worked calculation for P2: T = 6−2 = 4, W = 4−1 = 3, R = 5−2 = 3.
Idle time before a process arrives is not part of its waiting time.

### B — SJF

Timeline: Idle [0,2), P2 [2,3), P1 [3,6), Idle [6,8), P3 [8,10), P4 [10,11).
At t=2, P2 runs first because it has the shorter burst. At t=9, P4 cannot interrupt non-preemptive P3.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 3 | 6 | 4 | 1 | 1 |
| P2 | 2 | 3 | 1 | 0 | 0 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Average | | | 2.25 | 0.5 | 0.5 |

Worked calculation for P1: T = 6−2 = 4, W = 4−3 = 1, R = 3−2 = 1.

### B — SRTF

Timeline: Idle [0,2), P2 [2,3), P1 [3,6), Idle [6,8), P3 [8,10), P4 [10,11).
At t=9, P3 remaining=1 and P4 burst=1. P3 continues on the tie; the schedule matches SJF.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 3 | 6 | 4 | 1 | 1 |
| P2 | 2 | 3 | 1 | 0 | 0 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Average | | | 2.25 | 0.5 | 0.5 |

Worked calculation for P4: T = 11−9 = 2, W = 2−1 = 1, R = 10−9 = 1.

### B — RR, q=2

Timeline: Idle [0,2), P1 [2,4), P2 [4,5), P1 [5,6), Idle [6,8), P3 [8,10), P4 [10,11).
At t=4 the queue is P2,P1. P4 arriving at t=9 does not interrupt the P3 quantum.
P3 completes at t=10 and does not return to the queue.

| ID | S | C | T | W | R |
|---|---:|---:|---:|---:|---:|
| P1 | 2 | 6 | 4 | 1 | 0 |
| P2 | 4 | 5 | 3 | 2 | 2 |
| P3 | 8 | 10 | 2 | 0 | 0 |
| P4 | 10 | 11 | 2 | 1 | 1 |
| Average | | | 2.75 | 1 | 0.75 |

Worked calculation for P1: T = 6−2 = 4, W = 4−3 = 1, R = 2−2 = 0.

## Comparison and report use

The eight golden examples match these schedules, first-start/completion values and averages.
Per-process CPU allocation and the other required invariants are checked separately.

The report exporter includes the prior hand values, current motor output and an exact comparison
for every example. This file is not the final PDF. RR q=1/2/4 analysis and the student's explanations
of the remaining report questions require separate review.
