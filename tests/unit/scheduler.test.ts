import { describe, expect, it } from 'vitest';
import { simulate, validateInput } from '../../src/domain/scheduler';
import { ALGORITHMS } from '../../src/domain/types';
import type { Algorithm, ProcessInput, SimulationResult } from '../../src/domain/types';
import { WORKLOADS } from '../../src/domain/workloads';

// Independent hand calculations completed with the student before implementation.
const GOLDENS: { workload: 'A' | 'B'; algorithm: Algorithm; chart: [string | null, number, number][];
  first: number[]; completion: number[]; averages: number[] }[] = [
  { workload: 'A', algorithm: 'FCFS', chart: [['P1',0,8],['P2',8,12],['P3',12,14],['P4',14,15]],
    first: [0,8,12,14], completion: [8,12,14,15], averages: [10.5,6.75,6.75] },
  { workload: 'A', algorithm: 'SJF', chart: [['P1',0,8],['P4',8,9],['P3',9,11],['P2',11,15]],
    first: [0,11,9,8], completion: [8,15,11,9], averages: [9,5.25,5.25] },
  { workload: 'A', algorithm: 'SRTF', chart: [['P1',0,1],['P2',1,2],['P3',2,4],['P4',4,5],['P2',5,8],['P1',8,15]],
    first: [0,1,2,4], completion: [15,8,4,5], averages: [6.25,2.5,0] },
  { workload: 'A', algorithm: 'RR', chart: [['P1',0,2],['P2',2,4],['P3',4,6],['P1',6,8],['P4',8,9],['P2',9,11],['P1',11,13],['P1',13,15]],
    first: [0,2,4,8], completion: [15,11,6,9], averages: [8.5,4.75,1.75] },
  { workload: 'B', algorithm: 'FCFS', chart: [[null,0,2],['P1',2,5],['P2',5,6],[null,6,8],['P3',8,10],['P4',10,11]],
    first: [2,5,8,10], completion: [5,6,10,11], averages: [2.75,1,1] },
  { workload: 'B', algorithm: 'SJF', chart: [[null,0,2],['P2',2,3],['P1',3,6],[null,6,8],['P3',8,10],['P4',10,11]],
    first: [3,2,8,10], completion: [6,3,10,11], averages: [2.25,0.5,0.5] },
  { workload: 'B', algorithm: 'SRTF', chart: [[null,0,2],['P2',2,3],['P1',3,6],[null,6,8],['P3',8,10],['P4',10,11]],
    first: [3,2,8,10], completion: [6,3,10,11], averages: [2.25,0.5,0.5] },
  { workload: 'B', algorithm: 'RR', chart: [[null,0,2],['P1',2,4],['P2',4,5],['P1',5,6],[null,6,8],['P3',8,10],['P4',10,11]],
    first: [2,4,8,10], completion: [6,5,10,11], averages: [2.75,1,0.75] },
];

function assertInvariants(result: SimulationResult) {
  let end = 0;
  const consumed = new Map(result.processes.map(p => [p.id, 0]));
  for (const segment of result.segments) {
    expect(segment.start).toBe(end);
    expect(segment.end).toBeGreaterThan(segment.start);
    if (segment.processId !== null) {
      const process = result.processes.find(p => p.id === segment.processId)!;
      expect(segment.start).toBeGreaterThanOrEqual(process.arrival);
      consumed.set(process.id, consumed.get(process.id)! + segment.end - segment.start);
      if (result.algorithm === 'RR') expect(segment.end - segment.start).toBeLessThanOrEqual(result.quantum!);
    } else {
      for (const p of result.processes) {
        // No unfinished process may be ready at any point inside an idle interval.
        expect(p.arrival >= segment.end || consumed.get(p.id) === p.burst).toBe(true);
      }
    }
    end = segment.end;
  }
  expect(end).toBe(result.finishTime);
  for (const p of result.processes) {
    expect(consumed.get(p.id)).toBe(p.burst);
    expect(p.waiting).toBeGreaterThanOrEqual(0);
    expect(p.response).toBeGreaterThanOrEqual(0);
    const segments = result.segments.filter(s => s.processId === p.id);
    expect(p.firstStart).toBe(segments[0].start);
    expect(p.completion).toBe(segments.at(-1)!.end);
  }
}

describe('eight hand-calculated assignment examples', () => {
  for (const golden of GOLDENS) it(`${golden.workload} / ${golden.algorithm}`, () => {
    const result = simulate(WORKLOADS[golden.workload], golden.algorithm, 2);
    expect(result.segments.map(s => [s.processId, s.start, s.end])).toEqual(golden.chart);
    expect(result.processes.map(p => p.firstStart)).toEqual(golden.first);
    expect(result.processes.map(p => p.completion)).toEqual(golden.completion);
    expect(Object.values(result.averages)).toEqual(golden.averages);
    assertInvariants(result);
  });
});

describe('additional workloads and scheduling boundaries', () => {
  it('matches the student screenshot with P5 arriving at 5 for a 3-unit burst', () => {
    const result = simulate([...WORKLOADS.A, { id: 'P5', arrival: 5, burst: 3 }], 'RR', 2);
    expect(result.segments.map(s => [s.processId,s.start,s.end])).toEqual([
      ['P1',0,2],['P2',2,4],['P3',4,6],['P1',6,8],['P4',8,9],['P2',9,11],['P5',11,13],['P1',13,15],['P5',15,16],['P1',16,18],
    ]);
    expect(result.processes.map(p => [p.firstStart,p.completion])).toEqual([[0,18],[2,11],[4,6],[8,9],[11,16]]);
    expect(result.averages).toEqual({ turnaround: 9.6, waiting: 6, response: 2.6 });
    assertInvariants(result);
  });
  it('Workload A RR q=1 matches an independently traced FIFO schedule', () => {
    const r = simulate(WORKLOADS.A, 'RR', 1);
    expect(r.segments.map(s => s.processId)).toEqual(['P1','P2','P1','P3','P2','P1','P4','P3','P2','P1','P2','P1','P1','P1','P1']);
    expect(r.processes.map(p => [p.firstStart, p.completion, p.turnaround, p.waiting, p.response])).toEqual([[0,15,15,7,0],[1,11,10,6,0],[3,8,6,4,1],[6,7,3,2,2]]);
    expect(r.averages).toEqual({ turnaround: 8.5, waiting: 4.75, response: .75 });
  });
  it('Workload A RR q=4 admits boundary arrivals before requeueing P1', () => {
    const r = simulate(WORKLOADS.A, 'RR', 4);
    expect(r.segments.map(s => [s.processId,s.start,s.end])).toEqual([['P1',0,4],['P2',4,8],['P3',8,10],['P4',10,11],['P1',11,15]]);
    expect(r.processes.map(p => [p.firstStart,p.completion])).toEqual([[0,15],[4,8],[8,10],[10,11]]);
    expect(r.averages).toEqual({ turnaround: 9.25, waiting: 5.5, response: 3.75 });
  });
  it('initial and internal idle intervals', () => {
    const input = [{ id: 'X', arrival: 3, burst: 1 }, { id: 'Y', arrival: 7, burst: 2 }];
    for (const algorithm of ALGORITHMS) {
      expect(simulate(input, algorithm).segments.map(s => [s.processId,s.start,s.end]))
        .toEqual([[null,0,3],['X',3,4],[null,4,7],['Y',7,9]]);
    }
  });
  it('simultaneous equal jobs use input order, never alphabetical ID order', () => {
    const input = [{ id: 'Z', arrival: 0, burst: 1 }, { id: 'A', arrival: 0, burst: 1 }];
    for (const algorithm of ALGORITHMS) expect(simulate(input, algorithm).segments.map(s => s.processId)).toEqual(['Z','A']);
  });
  it('SRTF preempts on a strictly shorter remaining time', () => {
    const input = [{ id: 'L', arrival: 0, burst: 5 }, { id: 'S', arrival: 1, burst: 1 }];
    const result = simulate(input, 'SRTF');
    expect(result.segments.map(s => [s.processId,s.start,s.end])).toEqual([['L',0,1],['S',1,2],['L',2,6]]);
    expect(result.processes.map(p => p.waiting)).toEqual([1,0]);
  });
  it('SRTF keeps the running job on equal remaining time', () => {
    const result = simulate([{ id: 'Z', arrival: 0, burst: 2 }, { id: 'A', arrival: 1, burst: 1 }], 'SRTF');
    expect(result.segments.map(s => [s.processId,s.start,s.end])).toEqual([['Z',0,2],['A',2,3]]);
    expect(result.decisions[1].explanation).toContain('A tie does not cause preemption');
  });
  it('RR enqueues boundary arrivals before the unfinished runner', () => {
    const result = simulate([{ id: 'P1', arrival: 0, burst: 4 }, { id: 'P2', arrival: 2, burst: 1 },
      { id: 'P3', arrival: 1, burst: 1 }], 'RR', 2);
    expect(result.decisions[1].candidates.map(p => p.id)).toEqual(['P3','P2','P1']);
    expect(result.segments.map(s => [s.processId,s.start,s.end])).toEqual([['P1',0,2],['P3',2,3],['P2',3,4],['P1',4,6]]);
  });
  it('RR preserves consecutive slices and finishes without an extra turn', () => {
    const result = simulate([{ id: 'Solo', arrival: 0, burst: 4 }], 'RR', 2);
    expect(result.segments).toHaveLength(2);
    expect(result.segments.map(s => [s.start,s.end])).toEqual([[0,2],[2,4]]);
    expect(result.processes[0].firstStart).toBe(0);
  });
  it('selection ties prefer earlier arrival before input order', () => {
    const input = [{ id: 'Later', arrival: 2, burst: 2 }, { id: 'Earlier', arrival: 1, burst: 2 }, { id: 'Block', arrival: 0, burst: 4 }];
    expect(simulate(input,'SJF').segments.map(s => s.processId)).toEqual(['Block','Earlier','Later']);
  });
  it('does not mutate caller-owned workload data', () => {
    const input = Object.freeze(WORKLOADS.A.map(p => Object.freeze({ ...p })));
    for (const algorithm of ALGORITHMS) simulate(input as unknown as ProcessInput[], algorithm);
    expect(input).toEqual(WORKLOADS.A);
  });
  it('maintains invariants across 100 deterministic workloads and all policies', () => {
    let seed = 513;
    const random = (max: number) => { seed = (1664525 * seed + 1013904223) >>> 0; return seed % max; };
    for (let sample = 0; sample < 100; sample++) {
      const workload = Array.from({ length: random(7) + 1 }, (_, i) => ({ id: `P${i}`, arrival: random(20), burst: random(8) + 1 }));
      for (const algorithm of ALGORITHMS) assertInvariants(simulate(workload, algorithm, random(4) + 1));
    }
  });
});

describe('input validation', () => {
  it.each([-1, 0.5, NaN, Infinity, 1_000_001])('rejects arrival %s', arrival => {
    expect(() => simulate([{ id: 'P', arrival, burst: 1 }], 'FCFS')).toThrow('Arrival');
  });
  it.each([0, -1, 1.5, NaN, Infinity])('rejects burst %s', burst => {
    expect(() => simulate([{ id: 'P', arrival: 0, burst }], 'FCFS')).toThrow('Burst');
  });
  it.each([0, -1, 1.5, NaN, Infinity])('rejects quantum %s', q => expect(() => simulate(WORKLOADS.A, 'RR', q)).toThrow('Quantum'));
  it('rejects empty workload and duplicate or blank IDs', () => {
    expect(validateInput([], 'FCFS', 2)).not.toHaveLength(0);
    expect(() => simulate([{ id: ' ', arrival: 0, burst: 1 }], 'FCFS')).toThrow('ID');
    expect(() => simulate([{ id: 'X', arrival: 0, burst: 1 }, { id: ' X ', arrival: 1, burst: 2 }], 'FCFS')).toThrow('Duplicate');
  });
  it('bounds RR output size instead of blocking the browser', () => {
    expect(() => simulate([{ id: 'P', arrival: 0, burst: 2001 }], 'RR', 1)).toThrow('slice');
    expect(simulate([{ id: 'P', arrival: 0, burst: 900000 }], 'FCFS').finishTime).toBe(900000);
  });
});
