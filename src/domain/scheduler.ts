import { ALGORITHMS } from './types';
import type { Algorithm, Decision, ProcessInput, Segment, SimulationResult } from './types';

export const LIMITS = { processes: 64, time: 1_000_000, slices: 2_000 };

export function validateInput(inputs: ProcessInput[], algorithm: Algorithm, quantum: number): string[] {
  const errors: string[] = [];
  if (!ALGORITHMS.includes(algorithm)) errors.push('Geçerli bir algoritma seçin.');
  if (!inputs.length) errors.push('En az bir process ekleyin.');
  if (inputs.length > LIMITS.processes) errors.push(`En fazla ${LIMITS.processes} process kullanılabilir.`);
  const ids = new Set<string>();
  for (const [index, process] of inputs.entries()) {
    const label = `${index + 1}. satır`;
    const id = process.id.trim();
    if (!id || id.length > 24) errors.push(`${label}: ID, 1–24 karakter olmalı.`);
    if (ids.has(id)) errors.push(`${label}: "${id}" ID'si tekrar ediyor. Her ID benzersiz olmalı.`);
    ids.add(id);
    if (!Number.isSafeInteger(process.arrival) || process.arrival < 0 || process.arrival > LIMITS.time) {
      errors.push(`${label}: Arrival, 0–${LIMITS.time} arasında bir tam sayı olmalı.`);
    }
    if (!Number.isSafeInteger(process.burst) || process.burst <= 0 || process.burst > LIMITS.time) {
      errors.push(`${label}: Burst, 1–${LIMITS.time} arasında bir tam sayı olmalı.`);
    }
  }
  if (algorithm === 'RR' && (!Number.isSafeInteger(quantum) || quantum <= 0 || quantum > LIMITS.time)) {
    errors.push(`Quantum, 1–${LIMITS.time} arasında bir tam sayı olmalı.`);
  }
  if (!errors.length) {
    const upperBound = Math.max(...inputs.map(p => p.arrival)) + inputs.reduce((sum, p) => sum + p.burst, 0);
    if (upperBound > LIMITS.time) errors.push(`En büyük arrival + toplam burst en fazla ${LIMITS.time} olabilir.`);
    if (algorithm === 'RR' && inputs.reduce((sum, p) => sum + Math.ceil(p.burst / quantum), 0) > LIMITS.slices) {
      errors.push(`Bu quantum ${LIMITS.slices} dilim sınırını aşıyor. Quantum'u artırın veya burst'leri azaltın.`);
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
        explanation: `Hazır process yok. Sonraki geliş t = ${next}.`, outcome: 'CPU idle.' });
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
          ? `${selected.id} devam eder: kalan süre eşit. Eşitlikte preemption yapılmaz.`
          : `${selected.id} devam eder: daha kısa kalan süreye sahip hazır process yok.`
        : current && current.remaining > 0
          ? `${selected.id} seçildi: ${selected.remaining} < ${current.remaining}. ${current.id} kesildi (preemption).`
          : `${selected.id} seçildi: en kısa kalan süre ${selected.remaining}. Eşitlikte arrival, sonra giriş sırası kullanılır.`;
    } else if (algorithm === 'RR') {
      queue.shift();
      explanation = `${selected.id}, FIFO kuyruğunun başında. En fazla ${quantum} birim çalışır.`;
    } else {
      explanation = algorithm === 'FCFS'
        ? `${selected.id} seçildi: hazır process'ler arasında en erken arrival. Eşitlikte giriş sırası kullanılır.`
        : `${selected.id} seçildi: hazır process'ler arasında en kısa burst (${selected.burst}). Eşitlikte arrival, sonra giriş sırası kullanılır.`;
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
        ? `t = ${clock}: ${selected.id} tamamlandı.`
        : algorithm === 'RR'
          ? `t = ${clock}: quantum doldu; ${selected.remaining} birim kaldı. Gelenler önce, ${selected.id} sonra kuyruğa eklenir.`
          : `t = ${clock}: yeni geliş var; ${selected.id} için ${selected.remaining} birim kaldı.` });
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
    finishTime: clock, busyTime, idleTime: clock - busyTime };
}
