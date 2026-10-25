import assert from 'node:assert/strict';

// Independently traced references; never derive these from the scheduling motor.
const references = [
  { id: 'idle', algorithm: 'FCFS',
    segments: [[null, 0, 3], ['X', 3, 4], [null, 4, 7], ['Y', 7, 9]],
    processes: [['X', 3, 1, 3, 4, 1, 0, 0], ['Y', 7, 2, 7, 9, 2, 0, 0]],
    averages: { turnaround: 1.5, waiting: 0, response: 0 } },
  { id: 'ties', algorithm: 'SJF', segments: [['Z', 0, 1], ['A', 1, 2]],
    processes: [['Z', 0, 1, 0, 1, 1, 0, 0], ['A', 0, 1, 1, 2, 2, 1, 1]],
    averages: { turnaround: 1.5, waiting: 0.5, response: 0.5 } },
  { id: 'preemption', algorithm: 'SRTF', segments: [['L', 0, 1], ['S', 1, 2], ['L', 2, 6]],
    processes: [['L', 0, 5, 0, 6, 6, 1, 0], ['S', 1, 1, 1, 2, 1, 0, 0]],
    averages: { turnaround: 3.5, waiting: 0.5, response: 0 } },
];

export function verifyAdditionalExamples(presets, simulate) {
  return references.map(reference => {
    const preset = presets.find(p => p.id === reference.id);
    assert.ok(preset, `Missing report preset: ${reference.id}`);
    assert.equal(preset.algorithm, reference.algorithm, `${reference.id}: policy changed`);
    const expected = {
      segments: reference.segments.map(([processId, start, end]) => ({ processId, start, end })),
      processes: reference.processes.map(([id, arrival, burst, firstStart, completion, turnaround, waiting, response]) =>
        ({ id, arrival, burst, firstStart, completion, turnaround, waiting, response })),
      averages: reference.averages,
    };
    const result = simulate(preset.processes, preset.algorithm, 2);
    for (const key of ['segments', 'processes', 'averages']) {
      assert.deepEqual(result[key], expected[key], `${reference.id}: ${key} differ from the independent report reference`);
    }
    return { ...preset, expected, result, comparison: 'Exact match' };
  });
}
