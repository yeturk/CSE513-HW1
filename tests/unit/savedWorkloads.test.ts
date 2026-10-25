import { describe, expect, it } from 'vitest';
import { decodeSavedWorkloads } from '../../src/domain/savedWorkloads';

const saved = { id: 'one', name: 'Practice', algorithm: 'RR', quantum: 2, processes: [{ id: 'P1', arrival: 0, burst: 4 }] };
describe('safe browser workload recovery', () => {
  it('preserves valid inputs and removes unknown fields', () => {
    expect(decodeSavedWorkloads(JSON.stringify([{ ...saved, unexpected: true }]))).toEqual([saved]);
  });
  it.each([null, '{', '{}', 'null', '[]', 'x'.repeat(200001)])('ignores malformed or oversized storage (%#)', raw => {
    expect(decodeSavedWorkloads(raw)).toEqual([]);
  });
  it('ignores invalid records while recovering valid neighbours', () => {
    const invalid = [null, { ...saved, processes: [null] }, { ...saved, quantum: 0 }, { ...saved, algorithm: 'unknown' },
      { ...saved, processes: [{ id: 'P1', arrival: -1, burst: 1 }] }, { ...saved, processes: [{ id: 'P1', arrival: 0, burst: '4' }] }];
    expect(decodeSavedWorkloads(JSON.stringify([...invalid, saved]))).toEqual([saved]);
  });
  it('keeps names and record identifiers unique', () => {
    expect(decodeSavedWorkloads(JSON.stringify([saved, { ...saved, id: 'two', name: 'practice' }, { ...saved, name: 'Other' }]))).toEqual([saved]);
  });
  it('rejects saved RR workloads exceeding the slice limit', () => {
    expect(decodeSavedWorkloads(JSON.stringify([{ ...saved, quantum: 1, processes: [{ id: 'P1', arrival: 0, burst: 2001 }] }]))).toEqual([]);
  });
});
