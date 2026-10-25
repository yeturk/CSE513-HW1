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
