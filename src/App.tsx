import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ALGORITHMS } from './domain/types';
import type { Algorithm } from './domain/types';
import { simulate, validateInput } from './domain/scheduler';
import { PRESETS, WORKLOADS } from './domain/workloads';
import { decodeSavedWorkloads, MAX_SAVED_WORKLOADS, SAVED_WORKLOADS_KEY } from './domain/savedWorkloads';
import type { SavedWorkload } from './domain/savedWorkloads';
import { GettingStarted, needsTour } from './components/GettingStarted';
import { Rules } from './components/Rules';
import { ProcessEditor } from './components/ProcessEditor';
import type { DraftProcess } from './components/ProcessEditor';
import { Timeline } from './components/Timeline';
import { Averages, Comparison, Results } from './components/Results';

const initialRows: DraftProcess[] = WORKLOADS.A.map((p, key) => ({ key, id: p.id, arrival: String(p.arrival), burst: String(p.burst) }));
const asNumber = (value: string) => value.trim() === '' ? NaN : Number(value);
type Theme = 'light' | 'dark';
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('scheduling-lab-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* Theme selection still works when browser storage is unavailable. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [rows, setRows] = useState(initialRows);
  const [algorithm, setAlgorithm] = useState<Algorithm>('FCFS');
  const [quantum, setQuantum] = useState('2');
  const [workload, setWorkload] = useState('Workload A');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [selection, setSelection] = useState({ key: '', step: 0 });
  const [highlight, setHighlight] = useState<{ key: string; id: string | null }>({ key: '', id: null });
  const [showComparison, setShowComparison] = useState(false);
  const [tourOpen, setTourOpen] = useState(needsTour);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [timelineView, setTimelineView] = useState<'rail' | 'lanes'>('rail');
  const [presetId, setPresetId] = useState('A');
  const [savedWorkloads, setSavedWorkloads] = useState<SavedWorkload[]>(() => {
    try { return decodeSavedWorkloads(localStorage.getItem(SAVED_WORKLOADS_KEY)); } catch { return []; }
  });
  const [saveMessage, setSaveMessage] = useState('');
  const nextKey = useRef(4);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem('scheduling-lab-theme', theme); } catch { /* Optional preference storage. */ }
  }, [theme]);

  // Results are derived from the current inputs, never from an older run.
  const inputs = useMemo(() => rows.map(p => ({ id: p.id, arrival: asNumber(p.arrival), burst: asNumber(p.burst) })), [rows]);
  const q = asNumber(quantum);
  const simulation = useMemo(() => {
    const errors = validateInput(inputs, algorithm, q);
    return { errors, result: errors.length ? null : simulate(inputs, algorithm, q) };
  }, [inputs, algorithm, q]);
  const { errors, result } = simulation;
  const resultKey = JSON.stringify({ rows, algorithm, quantum });
  const step = selection.key === resultKey ? selection.step : 0;
  const selectedProcessId = highlight.key === resultKey ? highlight.id : null;
  const onSelectProcess = (id: string | null) => setHighlight({ key: resultKey, id });
  function resetExploration() {
    setSelection({ key: '', step: 0 }); setHighlight({ key: '', id: null }); setSaveMessage('');
  }
  function loadWorkload(id: string) {
    const preset = PRESETS.find(p => p.id === id);
    const saved = savedWorkloads.find(p => `saved:${p.id}` === id);
    const chosen = preset ?? saved;
    if (!chosen) return;
    resetExploration();
    setRows(chosen.processes.map(p => ({ key: nextKey.current++, id: p.id, arrival: String(p.arrival), burst: String(p.burst) })));
    setWorkload(chosen.name); setPresetId(id);
    if (chosen.algorithm) setAlgorithm(chosen.algorithm);
    if (saved) setQuantum(String(saved.quantum));
    else if (preset?.algorithm) setQuantum('2');
  }
  function saveWorkload(name: string) {
    const clean = name.trim();
    if (!clean || clean.length > 48) { setSaveMessage('Enter a name of 1–48 characters.'); return false; }
    if (!result || !Number.isSafeInteger(q) || q < 1 || q > 1_000_000) { setSaveMessage('Fix the process inputs and quantum before saving.'); return false; }
    if (savedWorkloads.some(p => p.name.toLowerCase() === clean.toLowerCase())) { setSaveMessage('That name is already saved. Choose a different name.'); return false; }
    if (savedWorkloads.length >= MAX_SAVED_WORKLOADS) { setSaveMessage(`You can save up to ${MAX_SAVED_WORKLOADS} workloads. Remove one before saving another.`); return false; }
    const saved: SavedWorkload = { id: crypto.randomUUID(), name: clean, algorithm, quantum: q,
      processes: result.processes.map(({ id, arrival, burst }) => ({ id, arrival, burst })) };
    const updated = [...savedWorkloads, saved];
    try { localStorage.setItem(SAVED_WORKLOADS_KEY, JSON.stringify(updated)); }
    catch { setSaveMessage('Browser storage is unavailable or full. Export results to keep a copy instead.'); return false; }
    setSavedWorkloads(updated); setPresetId(`saved:${saved.id}`); setWorkload(clean); setSaveMessage(`Saved “${clean}” in this browser.`); return true;
  }
  function removeSavedWorkload() {
    const updated = savedWorkloads.filter(p => `saved:${p.id}` !== presetId);
    try { localStorage.setItem(SAVED_WORKLOADS_KEY, JSON.stringify(updated)); }
    catch { setSaveMessage('Browser storage is unavailable. The saved workload could not be removed.'); return; }
    setSavedWorkloads(updated); setPresetId(''); setWorkload('Custom workload'); setSaveMessage('Saved copy removed. Current inputs are kept.');
  }
  const comparison = useMemo(() => {
    if (!showComparison || !result) return { results: null, error: '' };
    const found = validateInput(inputs, 'RR', q);
    return found.length ? { results: null, error: found.join(' ') }
      : { results: ALGORITHMS.map(a => simulate(inputs, a, q)), error: '' };
  }, [showComparison, result, inputs, q]);

  function download() {
    if (!result) return;
    const payload = { workload, result, comparison: comparison.results };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `scheduling-${result.algorithm.toLowerCase()}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <>
    <a className="skip-link" href="#results">Skip to results</a>
    <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      <div><h1>Scheduling Lab</h1><p>CPU scheduling, made visible.</p></div></div>
      <div className="header-tools"><button type="button" className="guide-button" onClick={() => setTourOpen(true)}>Getting started</button>
        <button type="button" className="guide-button" onClick={() => setRulesOpen(true)}>Rules</button><div className="theme-switch" role="group" aria-label="Color theme">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><span aria-hidden="true">☀</span> Light</button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><span aria-hidden="true">☾</span> Dark</button>
      </div><div className="course-label"><span>CSE513</span><small>CPU Scheduling Simulator</small></div></div>
    </header>
    <div className="lab-intro"><div><h2>One CPU. Every decision explained.</h2><p>Build a workload, trace the ready queue, and compare the trade-offs.</p><a className="mobile-results-link" href="#results">View current results ↓</a></div>
      <ol className="learning-path" aria-label="How to use this lab"><li><b>1</b> Set up</li><li><b>2</b> Trace</li><li><b>3</b> Compare</li></ol></div>
    <main className="app-layout">
      <ProcessEditor rows={rows} algorithm={algorithm} quantum={quantum} errors={errors} workload={workload}
        presetId={presetId} savedWorkloads={savedWorkloads} saveMessage={saveMessage} onSave={saveWorkload} onDeleteSaved={removeSavedWorkload}
        onField={(key, field, value) => { resetExploration(); setPresetId(''); setRows(old => old.map(p => p.key === key ? { ...p, [field]: value } : p)); setWorkload('Custom workload'); }}
        onRemove={key => { resetExploration(); setPresetId(''); setRows(old => old.filter(p => p.key !== key)); setWorkload('Custom workload'); }}
        onAdd={() => { let id = 1; while (rows.some(p => p.id.trim() === `P${id}`)) id++;
          const row = { key: nextKey.current++, id: `P${id}`, arrival: '0', burst: '1' };
          resetExploration(); setPresetId(''); setRows(old => [...old, row]); setWorkload('Custom workload'); }}
        onAlgorithm={value => { resetExploration(); setAlgorithm(value); }} onQuantum={value => { resetExploration(); setQuantum(value); }}
        onLoad={loadWorkload} />
      <div className="results-workspace" id="results">
        <div className="workspace-heading"><div><span className="algorithm-tag">{algorithm}{algorithm === 'RR' ? ` / q = ${quantum || '—'}` : ''}</span>
          <h2>{workload}</h2></div><button type="button" className="export-button" disabled={!result} onClick={download}>Export results ↓</button></div>
        {result ? <>
          <Timeline key={resultKey} result={result} step={step} onStep={value => setSelection({ key: resultKey, step: value })}
            selectedProcessId={selectedProcessId} onSelectProcess={onSelectProcess} view={timelineView} onViewChange={setTimelineView} />
          <Averages result={result} />
          <div className="result-details"><Results result={result} selectedProcessId={selectedProcessId} onSelectProcess={onSelectProcess} />
          <Comparison results={comparison.results} onCompare={() => setShowComparison(!showComparison)} error={comparison.error} expanded={showComparison} /></div>
        </> : <section className="panel empty-results" aria-labelledby="empty-title">
          <span className="empty-symbol" aria-hidden="true">—</span><h2 id="empty-title">Ready when your inputs are</h2>
          <p>Fix the input errors to see the timeline and metrics. Results update automatically; no previous results are shown.</p>
        </section>}
      </div>
    </main>
    <footer className="app-footer"><span>CSE513 · Learn, trace, compare.</span><span>One CPU · No I/O · Context switch = 0</span></footer>
    {tourOpen && <GettingStarted onClose={() => setTourOpen(false)} />}
    {rulesOpen && <Rules onClose={() => setRulesOpen(false)} />}
    <p className="sr-only" role="status">{result ? `${workload}, ${algorithm}: results updated.` : 'Results cleared. Check your inputs.'}</p>
  </>;
}
