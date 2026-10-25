import { describe, expect, it } from 'vitest';
import { verifyAdditionalExamples } from '../../scripts/report-verification.mjs';
import { PRESETS } from '../../src/domain/workloads';
import { simulate } from '../../src/domain/scheduler';

describe('additional report references', () => {
  it('verifies all three independent timelines, process metrics and averages', () => {
    expect(verifyAdditionalExamples(PRESETS, simulate).map(e => e.comparison)).toEqual(['Exact match', 'Exact match', 'Exact match']);
  });
  it('rejects a missing or renamed preset', () => {
    expect(() => verifyAdditionalExamples(PRESETS.filter(p => p.id !== 'ties'), simulate)).toThrow('Missing report preset: ties');
  });
  it.each(['segments', 'processes', 'averages'])('rejects a mismatch in %s instead of printing a match', key => {
    expect(() => verifyAdditionalExamples(PRESETS, (...args) => {
      const result = simulate(...args);
      if (key === 'segments') result.segments[0].end += 1;
      if (key === 'processes') result.processes[0].waiting += 1;
      if (key === 'averages') result.averages.waiting += 1;
      return result;
    })).toThrow(`${key} differ from the independent report reference`);
  });
  it('rejects a preset edited without updating its independently checked reference', () => {
    const changed = structuredClone(PRESETS);
    changed.find(p => p.id === 'idle').processes[0].burst = 2;
    expect(() => verifyAdditionalExamples(changed, simulate)).toThrow('idle: segments differ');
  });
});
