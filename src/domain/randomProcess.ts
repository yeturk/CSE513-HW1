import { LIMITS, validateInput } from './scheduler';
import type { Algorithm, ProcessInput } from './types';

/** Inclusive integer ranges, tightened to leave room within the simulator's limits. */
export function randomProcessRanges(inputs: ProcessInput[], algorithm: Algorithm, quantum: number) {
  if (inputs.length >= LIMITS.processes) return null;
  // An empty editor is a valid starting point for generating its first process.
  if (validateInput(inputs.length ? inputs : [{ id: 'P1', arrival: 0, burst: 1 }], algorithm, quantum).length) return null;
  const maxArrival = Math.max(0, ...inputs.map(p => p.arrival));
  const maxBurst = Math.max(1, ...inputs.map(p => p.burst));
  const totalBurst = inputs.reduce((sum, p) => sum + p.burst, 0);
  const arrivalMax = Math.min(Math.floor(maxArrival * 1.5), LIMITS.time - totalBurst - 1);
  let burstMax = Math.min(maxBurst * 2, LIMITS.time - totalBurst - Math.max(maxArrival, arrivalMax));
  if (algorithm === 'RR') {
    const usedSlices = inputs.reduce((sum, p) => sum + Math.ceil(p.burst / quantum), 0);
    burstMax = Math.min(burstMax, (LIMITS.slices - usedSlices) * quantum);
  }
  return arrivalMax < 0 || burstMax < 1 ? null : { arrivalMax, burstMax };
}

export function createRandomProcess(inputs: ProcessInput[], algorithm: Algorithm, quantum: number, random = Math.random): ProcessInput | null {
  const ranges = randomProcessRanges(inputs, algorithm, quantum);
  if (!ranges) return null;
  let number = 1;
  while (inputs.some(p => p.id.trim() === `P${number}`)) number++;
  return { id: `P${number}`, arrival: Math.floor(random() * (ranges.arrivalMax + 1)),
    burst: 1 + Math.floor(random() * ranges.burstMax) };
}
