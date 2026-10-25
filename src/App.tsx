import { useRef, useState } from 'react';
import { ALGORITHMS } from './domain/types';
import type { Algorithm, SimulationResult } from './domain/types';
import { simulate, validateInput } from './domain/scheduler';
import { WORKLOADS } from './domain/workloads';
import { ProcessEditor } from './components/ProcessEditor';
import type { DraftProcess } from './components/ProcessEditor';
import { Timeline } from './components/Timeline';
import { Averages, Comparison, Results } from './components/Results';

const initialRows: DraftProcess[] = WORKLOADS.A.map((p, key) => ({ key, id: p.id, arrival: String(p.arrival), burst: String(p.burst) }));
const signature = (rows: DraftProcess[], algorithm: Algorithm, quantum: string) => JSON.stringify({ rows: rows.map(({id,arrival,burst}) => ({id,arrival,burst})), algorithm, quantum });
const asNumber = (value: string) => value.trim() === '' ? NaN : Number(value);

export default function App() {
  const [rows, setRows] = useState(initialRows);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FCFS');
  const [quantum, setQuantum] = useState('2');
  const [workload, setWorkload] = useState('Workload A');
  const [run, setRun] = useState(() => ({ result: simulate(WORKLOADS.A,'FCFS'), signature: signature(initialRows,'FCFS','2'), quantum: 2, workload: 'Workload A' }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [comparison, setComparison] = useState<SimulationResult[] | null>(null);
  const [comparisonError, setComparisonError] = useState('');
  const [status, setStatus] = useState('Workload A için FCFS örneği hazır.');
  const nextKey = useRef(4);
  const dirty = signature(rows,algorithm,quantum) !== run.signature;

  function execute() {
    const inputs = rows.map(p => ({ id: p.id, arrival: asNumber(p.arrival), burst: asNumber(p.burst) }));
    const q = asNumber(quantum);
    const found = validateInput(inputs,algorithm,q);
    setErrors(found);
    if (found.length) return;
    setRun({ result: simulate(inputs,algorithm,q), signature: signature(rows,algorithm,quantum), quantum: q, workload });
    setStep(0); setComparison(null); setComparisonError('');
    setStatus(`${workload}, ${algorithm}: simülasyon tamamlandı.`);
  }

  function compare() {
    const found = validateInput(run.result.processes,'RR',run.quantum);
    if (found.length) { setComparisonError(found.join(' ')); return; }
    setComparison(ALGORITHMS.map(a => simulate(run.result.processes,a,run.quantum)));
    setComparisonError('');
    setStatus('Dört algoritma son çalıştırılan girdilerle karşılaştırıldı.');
  }

  function download() {
    const payload = { workload: run.workload, result: run.result, comparison };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `scheduling-${run.result.algorithm.toLowerCase()}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <a className="skip-link" href="#results">Sonuçlara geç</a>
    <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <div><h1>Scheduling Lab</h1><p>CPU kararlarını görünür kıl.</p></div></div>
      <div className="course-label"><span>CSE513</span><small>CPU Scheduling Simulator</small></div>
    </header>
    <main className="app-layout">
      <ProcessEditor rows={rows} algorithm={algorithm} quantum={quantum} dirty={dirty} errors={errors} workload={workload}
        onField={(key, field, value) => { setRows(old => old.map(p => p.key === key ? { ...p, [field]: value } : p)); setWorkload('Özel workload'); setErrors([]); }}
        onRemove={key => { setRows(old => old.filter(p => p.key !== key)); setWorkload('Özel workload'); setErrors([]); }}
        onAdd={() => { let id = 1; while (rows.some(p => p.id.trim() === `P${id}`)) id++;
          setRows(old => [...old, { key: nextKey.current++, id: `P${id}`, arrival: '0', burst: '1' }]); setWorkload('Özel workload'); setErrors([]); }}
        onAlgorithm={value => { setAlgorithm(value); setErrors([]); }} onQuantum={value => { setQuantum(value); setErrors([]); }}
        onLoad={name => { setRows(WORKLOADS[name].map(p => ({ key: nextKey.current++, id: p.id, arrival: String(p.arrival), burst: String(p.burst) })));
          setWorkload(`Workload ${name}`); setErrors([]); }} onRun={execute} />
      <div className={`results-workspace ${dirty ? 'is-stale' : ''}`} id="results">
        {dirty && <div className="stale-notice" role="status"><span><strong>Girdiler değişti.</strong> Aşağıdaki sonuçlar önceki çalıştırmaya ait.</span>
          <button type="button" onClick={execute}>Yeniden hesapla</button></div>}
        <div className="workspace-heading"><div><span className="algorithm-tag">{run.result.algorithm}{run.result.quantum !== null ? ` / q = ${run.result.quantum}` : ''}</span>
          <h2>{run.workload}</h2></div><button type="button" className="export-button" onClick={download}>Sonuçları indir ↓</button></div>
        <Averages result={run.result} />
        <Timeline result={run.result} step={step} onStep={setStep} />
        <Results result={run.result} />
        <Comparison results={comparison} onCompare={compare} error={comparisonError} />
      </div>
    </main>
    <footer className="app-footer"><span>CSE513 · Öğrenmek, izlemek ve karşılaştırmak için.</span><span>Tek CPU · I/O yok · Context switch = 0</span></footer>
    <p className="sr-only" role="status">{status}</p>
  </>;
}
