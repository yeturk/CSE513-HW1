import { describe, expect, it } from 'vitest';
import { createRandomProcess, randomProcessRanges } from '../../src/domain/randomProcess';
import { validateInput } from '../../src/domain/scheduler';
import { WORKLOADS } from '../../src/domain/workloads';

describe('one-at-a-time bounded random processes', () => {
  it('uses inclusive endpoints based on the current maxima without changing inputs', () => {
    const inputs = structuredClone(WORKLOADS.A);
    expect(randomProcessRanges(inputs, 'FCFS', 2)).toEqual({ arrivalMax: 6, burstMax: 16 });
    expect(createRandomProcess(inputs, 'FCFS', 2, () => 0)).toEqual({ id: 'P5', arrival: 0, burst: 1 });
    expect(createRandomProcess(inputs, 'FCFS', 2, () => 0.999999)).toEqual({ id: 'P5', arrival: 6, burst: 16 });
    expect(inputs).toEqual(WORKLOADS.A);
  });
  it('floors the arrival upper bound and recomputes ranges after each addition', () => {
    const inputs = [{ id: 'P1', arrival: 3, burst: 2 }];
    expect(randomProcessRanges(inputs, 'FCFS', 2)).toEqual({ arrivalMax: 4, burstMax: 4 });
    inputs.push(createRandomProcess(inputs, 'FCFS', 2, () => 0.999999)!);
    expect(randomProcessRanges(inputs, 'FCFS', 2)).toEqual({ arrivalMax: 6, burstMax: 8 });
  });
  it('supports empty and all-zero arrivals with positive bursts and unique IDs', () => {
    expect(createRandomProcess([], 'RR', 2, () => 0)).toEqual({ id: 'P1', arrival: 0, burst: 1 });
    expect(randomProcessRanges([], 'FCFS', 2)).toEqual({ arrivalMax: 0, burstMax: 2 });
    expect(createRandomProcess([{ id: ' P1 ', arrival: 0, burst: 1 }, { id: 'P3', arrival: 0, burst: 1 }], 'FCFS', 2, () => 0.9))
      .toEqual({ id: 'P2', arrival: 0, burst: 2 });
  });
  it('refuses invalid data and full process capacity', () => {
    for (const burst of [0, -1, NaN, 1.5]) expect(createRandomProcess([{ id: 'P1', arrival: 0, burst }], 'FCFS', 2)).toBeNull();
    expect(createRandomProcess([], 'RR', 0)).toBeNull();
    expect(createRandomProcess(Array.from({ length: 64 }, (_, i) => ({ id: `X${i}`, arrival: 0, burst: 1 })), 'FCFS', 2)).toBeNull();
  });
  it('caps time ranges and refuses exhausted time capacity', () => {
    const inputs = [{ id: 'P1', arrival: 999_990, burst: 5 }];
    const generated = createRandomProcess(inputs, 'FCFS', 2, () => 0.999999)!;
    expect(generated).toEqual({ id: 'P2', arrival: 999_994, burst: 1 });
    expect(validateInput([...inputs, generated], 'FCFS', 2)).toEqual([]);
    expect(createRandomProcess([{ id: 'P1', arrival: 999_999, burst: 1 }], 'FCFS', 2)).toBeNull();
  });
  it('respects remaining RR slice capacity', () => {
    const inputs = [{ id: 'P1', arrival: 0, burst: 3998 }];
    expect(createRandomProcess(inputs, 'RR', 2, () => 0.999999)?.burst).toBe(2);
    expect(createRandomProcess([{ ...inputs[0], burst: 4000 }], 'RR', 2)).toBeNull();
  });
});
