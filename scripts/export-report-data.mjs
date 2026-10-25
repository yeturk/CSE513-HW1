import { createServer } from 'vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { simulate } = await server.ssrLoadModule('/src/domain/scheduler.ts');
  const { WORKLOADS, PRESETS } = await server.ssrLoadModule('/src/domain/workloads.ts');
  const hand = await readFile('docs/hand-calculations.md', 'utf8');
  const examples = [];
  for (const match of hand.matchAll(/### ([AB]) — (FCFS|SJF|SRTF|RR)[^\n]*\n([\s\S]*?)(?=\n##|$)/g)) {
    const [, workload, algorithm, section] = match;
    const processes = [...section.matchAll(/^\| (P\d+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \| ([\d,]+) \|/gm)].map(m => {
      const [firstStart, completion, turnaround, waiting, response] = m.slice(2).map(Number);
      return { ...WORKLOADS[workload].find(p => p.id === m[1]), firstStart, completion, turnaround, waiting, response };
    });
    const timeline = section.match(/Timeline: ([\s\S]*?)\./)[1];
    const segments = [...timeline.matchAll(/(P\d+|Idle) \[(\d+),(\d+)\)/g)].map(m => ({ processId: m[1] === 'Idle' ? null : m[1], start: Number(m[2]), end: Number(m[3]) }));
    assert.equal(processes.length, 4);
    const manual = { processes, segments, averages: Object.fromEntries(['turnaround','waiting','response'].map(key => [key, processes.reduce((sum,p) => sum + p[key],0) / 4])) };
    const actual = simulate(WORKLOADS[workload], algorithm, 2);
    assert.deepEqual(actual.processes, manual.processes, `${workload}/${algorithm} metrics differ from prior hand calculations`);
    assert.deepEqual(actual.segments, manual.segments, `${workload}/${algorithm} timeline differs`);
    assert.deepEqual(actual.averages, manual.averages);
    examples.push({ workload, algorithm, input: WORKLOADS[workload], manual, actual, comparison: 'Exact match' });
  }
  assert.equal(examples.length, 8);
  const additional = PRESETS.filter(p => ['idle','ties','preemption'].includes(p.id)).map(p => ({ ...p, result: simulate(p.processes,p.algorithm,2) }));
  const quantum = [1,2,4].map(q => simulate(WORKLOADS.A,'RR',q));
  await mkdir('output/report-data', { recursive: true });
  await writeFile('output/report-data/results.json', JSON.stringify({ generatedAt: new Date().toISOString(), examples, additional, quantum }, null, 2));
  console.log('Verified all 8 previously hand-calculated examples against current simulator output. Report data saved.');
} finally { await server.close(); }
