import { ALGORITHMS } from './types';
import type { Algorithm, Decision, ProcessInput, Segment, SimulationResult } from './types';

export const LIMITS = { processes: 64, time: 1_000_000, slices: 2_000 };

export function validateInput(inputs: ProcessInput[], algorithm: Algorithm, quantum: number): string[] {
  const errors: string[] = [];
  if (!ALGORITHMS.includes(algorithm)) errors.push('Choose a valid scheduling algorithm.');
  if (!inputs.length) errors.push('Add at least one process.');
  if (inputs.length > LIMITS.processes) errors.push(`Use no more than ${LIMITS.processes} processes.`);
  const ids = new Set<string>();
  for (const [index, process] of inputs.entries()) {
    const label = `Row ${index + 1}`;
    const id = process.id.trim();
    if (!id || id.length > 24) errors.push(`${label}: ID must contain 1–24 characters.`);
    if (ids.has(id)) errors.push(`${label}: Duplicate ID "${id}". Every ID must be unique.`);
    ids.add(id);
    if (!Number.isSafeInteger(process.arrival) || process.arrival < 0 || process.arrival > LIMITS.time) {
      errors.push(`${label}: Arrival must be an integer from 0 to ${LIMITS.time}.`);
    }
    if (!Number.isSafeInteger(process.burst) || process.burst <= 0 || process.burst > LIMITS.time) {
      errors.push(`${label}: Burst must be an integer from 1 to ${LIMITS.time}.`);
    }
  }
  if (algorithm === 'RR' && (!Number.isSafeInteger(quantum) || quantum <= 0 || quantum > LIMITS.time)) {
    errors.push(`Quantum must be an integer from 1 to ${LIMITS.time}.`);
  }
  if (!errors.length) {
    const upperBound = Math.max(...inputs.map(p => p.arrival)) + inputs.reduce((sum, p) => sum + p.burst, 0);
    if (upperBound > LIMITS.time) errors.push(`Maximum arrival + total burst must not exceed ${LIMITS.time}.`);
    if (algorithm === 'RR' && inputs.reduce((sum, p) => sum + Math.ceil(p.burst / quantum), 0) > LIMITS.slices) {
      errors.push(`This quantum exceeds the ${LIMITS.slices}-slice limit. Increase the quantum or reduce burst times.`);
    }
  }
  return errors;
}

interface Job extends ProcessInput {
  order: number;
  remaining: number;
  firstStart: number | null;
  completion: number | null;
}

const arrivalOrder = (a: Job, b: Job) => a.arrival - b.arrival || a.order - b.order;

/** Direct handoffs between different processes; idle and initial dispatch are excluded. */
export function countContextSwitches(segments: Segment[]): number {
  return segments.reduce((count, segment, index) => {
    const previous = segments[index - 1];
    return count + Number(!!previous && previous.end === segment.start
      && previous.processId !== null && segment.processId !== null
      && previous.processId !== segment.processId);
  }, 0);
}

/** Pure, event-driven simulation. Time jumps to arrivals, completions or RR boundaries. */
export function simulate(inputs: ProcessInput[], algorithm: Algorithm, quantum = 2): SimulationResult {
  const errors = validateInput(inputs, algorithm, quantum);
  if (errors.length) throw new Error(errors.join('\n'));
  const jobs: Job[] = inputs.map((p, order) => ({
    ...p, id: p.id.trim(), order, remaining: p.burst, firstStart: null, completion: null,
  }));
  const pending = [...jobs].sort(arrivalOrder);
  const queue: Job[] = [];
  const segments: Segment[] = [];
  const decisions: Decision[] = [];
  let clock = 0;
  let finished = 0;
  let arrivalIndex = 0;
  let current: Job | null = null;

  function admitArrivals() {
    while (arrivalIndex < pending.length && pending[arrivalIndex].arrival <= clock) {
      queue.push(pending[arrivalIndex++]);
    }
  }

  function record(decision: Decision) {
    decisions.push(decision);
    const previous = segments.at(-1);
    // Preserve every RR slice, even when the same process gets consecutive turns.
    if (algorithm !== 'RR' && previous?.processId === decision.processId && previous.end === decision.start) {
      previous.end = decision.end;
    } else {
      segments.push({ processId: decision.processId, start: decision.start, end: decision.end });
    }
  }

  while (finished < jobs.length) {
    admitArrivals();
    const ready = algorithm === 'RR' ? [...queue] : jobs.filter(p => p.arrival <= clock && p.remaining > 0);
    if (!ready.length) {
      const next = pending[arrivalIndex].arrival;
      record({ processId: null, start: clock, end: next, candidates: [],
        explanation: `No process is ready. The next arrival is at t = ${next}.`, outcome: 'CPU idle.' });
      clock = next;
      current = null;
      continue;
    }

    if (algorithm === 'FCFS') ready.sort(arrivalOrder);
    if (algorithm === 'SJF') ready.sort((a, b) => a.burst - b.burst || arrivalOrder(a, b));
    if (algorithm === 'SRTF') ready.sort((a, b) => a.remaining - b.remaining || arrivalOrder(a, b));
    let selected = ready[0];
    const candidates = ready.map(p => ({ id: p.id, remaining: p.remaining }));
    let explanation = '';
    if (algorithm === 'SRTF') {
      // An equal remainder never preempts the running job, even if a tie-break favors a waiter.
      if (current && current.remaining > 0 && current.remaining <= selected.remaining) selected = current;
      const hasEqualWaiter = ready.some(p => p !== selected && p.remaining === selected.remaining);
      explanation = current === selected
        ? hasEqualWaiter
          ? `${selected.id} continues: remaining times are equal. A tie does not cause preemption.`
          : `${selected.id} continues: no ready process has a shorter remaining time.`
        : current && current.remaining > 0
          ? `${selected.id} is selected: ${selected.remaining} < ${current.remaining}. ${current.id} is preempted.`
          : `${selected.id} is selected: shortest remaining time (${selected.remaining}). Ties use arrival, then input order.`;
    } else if (algorithm === 'RR') {
      queue.shift();
      explanation = `${selected.id} is at the front of the FIFO queue. It runs for up to ${quantum} time units.`;
    } else {
      explanation = algorithm === 'FCFS'
        ? `${selected.id} is selected: earliest arrival among ready processes. Ties use input order.`
        : `${selected.id} is selected: shortest ready burst (${selected.burst}). Ties use arrival, then input order.`;
    }

    const start = clock;
    let duration = selected.remaining;
    if (algorithm === 'RR') duration = Math.min(duration, quantum);
    if (algorithm === 'SRTF' && arrivalIndex < pending.length) {
      duration = Math.min(duration, pending[arrivalIndex].arrival - clock);
    }
    if (selected.firstStart === null) selected.firstStart = start;
    clock += duration;
    selected.remaining -= duration;
    if (selected.remaining === 0) {
      selected.completion = clock;
      finished++;
    }
    // Admit arrivals through the boundary BEFORE re-enqueuing the unfinished RR job.
    admitArrivals();
    if (algorithm === 'RR' && selected.remaining > 0) queue.push(selected);
    record({ processId: selected.id, start, end: clock, candidates, explanation,
      outcome: selected.remaining === 0
        ? `t = ${clock}: ${selected.id} completes.`
        : algorithm === 'RR'
          ? `t = ${clock}: quantum expires with ${selected.remaining} units left. Arrivals join the queue before ${selected.id} returns to the tail.`
          : `t = ${clock}: a new process arrives; ${selected.id} has ${selected.remaining} units remaining.` });
    current = selected.remaining > 0 ? selected : null;
  }

  const processes = jobs.map(p => {
    const firstStart = p.firstStart!;
    const completion = p.completion!;
    const turnaround = completion - p.arrival;
    return { id: p.id, arrival: p.arrival, burst: p.burst, firstStart, completion,
      turnaround, waiting: turnaround - p.burst, response: firstStart - p.arrival };
  });
  const mean = (key: 'turnaround' | 'waiting' | 'response') => processes.reduce((sum, p) => sum + p[key], 0) / processes.length;
  const busyTime = jobs.reduce((sum, p) => sum + p.burst, 0);
  return { algorithm, quantum: algorithm === 'RR' ? quantum : null, processes, segments, decisions,
    averages: { turnaround: mean('turnaround'), waiting: mean('waiting'), response: mean('response') },
    finishTime: clock, busyTime, idleTime: clock - busyTime, contextSwitches: countContextSwitches(segments) };
}
