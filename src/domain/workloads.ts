import type { ProcessInput } from './types';

export const WORKLOADS: Record<'A' | 'B', ProcessInput[]> = {
  A: [
    { id: 'P1', arrival: 0, burst: 8 },
    { id: 'P2', arrival: 1, burst: 4 },
    { id: 'P3', arrival: 2, burst: 2 },
    { id: 'P4', arrival: 4, burst: 1 },
  ],
  B: [
    { id: 'P1', arrival: 2, burst: 3 },
    { id: 'P2', arrival: 2, burst: 1 },
    { id: 'P3', arrival: 8, burst: 2 },
    { id: 'P4', arrival: 9, burst: 1 },
  ],
};

export const PRESETS = [
  { id: 'A', name: 'Workload A', category: 'Assignment', description: 'Four arrivals, different burst lengths. Compare how each policy treats short jobs.', processes: WORKLOADS.A, algorithm: null },
  { id: 'B', name: 'Workload B', category: 'Assignment', description: 'Idle gaps and simultaneous arrivals. Watch the tie at t = 9 in SRTF.', processes: WORKLOADS.B, algorithm: null },
  { id: 'idle', name: 'Idle intervals', category: 'Explore', description: 'The CPU waits until t = 3, then again from t = 4 to 7. Idle before arrival is not process waiting.', processes: [{ id: 'X', arrival: 3, burst: 1 }, { id: 'Y', arrival: 7, burst: 2 }], algorithm: 'FCFS' },
  { id: 'ties', name: 'Simultaneous arrivals', category: 'Explore', description: 'Z and A arrive together with equal bursts. Input order puts Z first, even though A comes first alphabetically.', processes: [{ id: 'Z', arrival: 0, burst: 1 }, { id: 'A', arrival: 0, burst: 1 }], algorithm: 'SJF' },
  { id: 'preemption', name: 'A shorter job arrives', category: 'Explore', description: 'At t = 1, S needs 1 unit and L has 4 left. SRTF interrupts L; try SJF to see the difference.', processes: [{ id: 'L', arrival: 0, burst: 5 }, { id: 'S', arrival: 1, burst: 1 }], algorithm: 'SRTF' },
  { id: 'boundary', name: 'Round Robin boundary', category: 'Explore', description: 'At t = 2, the new arrival joins before P1 returns. The next ready queue is P3, P2, P1.', processes: [{ id: 'P1', arrival: 0, burst: 4 }, { id: 'P2', arrival: 2, burst: 1 }, { id: 'P3', arrival: 1, burst: 1 }], algorithm: 'RR' },
] satisfies { id: string; name: string; category: string; description: string; processes: ProcessInput[]; algorithm: import('./types').Algorithm | null }[];
