import { useEffect, useMemo, useState } from 'react';
import { simulate } from '../domain/scheduler';
import { WORKLOADS } from '../domain/workloads';
import type { Segment, SimulationResult } from '../domain/types';
import { colorClass } from './Timeline';
import { ControlTooltip } from './ControlTooltip';
import './gantt-preview.css';

const sample = [...WORKLOADS.A, { id: 'P5', arrival: 5, burst: 3 }];
const OPTIONS = [
  { id: 'rail', letter: 'A', title: 'Compact CPU rail', description: 'One continuous CPU track. A quieter, shorter chart keeps the queue and explanation close.', fit: 'Recommended as the main view' },
  { id: 'lanes', letter: 'B', title: 'A lane for every process', description: 'Follow each process across a shared clock. Interruptions and time spent waiting are easier to see.', fit: 'Best for explaining preemption' },
  { id: 'outline', letter: 'C', title: 'Outlined time slices', description: 'Lightweight blocks, a colored edge, and explicit durations. Each RR turn remains distinct.', fit: 'Best for a calm, technical look' },
] as const;

function Ruler({ result }: { result: SimulationResult }) {
  return <div className="mock-ruler" aria-hidden="true">{[...result.segments.map(s => s.start),result.finishTime].map(t =>
    <span key={t} className={t === result.finishTime ? 'last' : ''} style={{ left: `${t/result.finishTime*100}%` }}>{t}</span>)}</div>;
}

export function GanttPreview() {
  const [theme, setTheme] = useState('dark');
  const [workload, setWorkload] = useState('five');
  const [selected, setSelected] = useState(3);
  const result = useMemo(() => simulate(workload === 'five' ? sample : workload === 'A' ? WORKLOADS.A : WORKLOADS.B, 'RR',2),[workload]);
  const active = result.segments[selected];
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; },[theme]);
  function block(segment: Segment, index: number, type: string) {
    const text = `${segment.processId ?? 'Idle'}: ${segment.start}–${segment.end}`;
    return <ControlTooltip key={index} content={`${text}. Duration: ${segment.end - segment.start}. Select to inspect.`}>
      <button type="button" className={`mock-block ${colorClass(result,segment.processId)} ${type} ${selected === index ? 'active' : ''}`}
        style={{ left: `${segment.start/result.finishTime*100}%`, width: `${(segment.end-segment.start)/result.finishTime*100}%` }}
        aria-label={text} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <b>{segment.processId ?? 'Idle'}</b>{type !== 'lane' && <small>{segment.end-segment.start}u</small>}
      </button>
    </ControlTooltip>;
  }
  return <main className="gantt-preview">
    <header className="preview-heading"><div><p className="preview-label">Scheduling Lab / Design study</p><h1>Three ways to read the same schedule.</h1>
      <p>Interactive mockups. All three use the same calculated RR schedule and proportional time scale.</p></div><a href={import.meta.env.BASE_URL}>Back to the simulator</a></header>
    <div className="preview-controls panel"><label>Workload<select aria-label="Workload" value={workload} onChange={e => { setWorkload(e.target.value); setSelected(0); }}>
      <option value="five">Your five-process example</option><option value="A">Workload A</option><option value="B">Workload B / idle intervals</option></select></label>
      <span className="quiet-badge">Source Sans 3 / bundled web font</span>
      <div className="theme-switch" role="group" aria-label="Preview theme"><button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Light</button><button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button></div>
      <span className="quiet-badge">Round Robin / q = 2 / {result.finishTime} units</span></div>
    <p className="preview-inputs">{result.processes.map(p => `${p.id}: arrival ${p.arrival}, burst ${p.burst}`).join('  ·  ')}</p>
    {OPTIONS.map(option => <section key={option.id} className={`panel mock-option mock-${option.id}`} aria-labelledby={`option-${option.id}`}>
      <div className="mock-heading"><div className="mock-title"><span>{option.letter}</span><div><h2 id={`option-${option.id}`}>{option.title}</h2><p>{option.description}</p></div></div><span className="quiet-badge">{option.fit}</span></div>
      <div className="mock-scroll" tabIndex={0} aria-label={`${option.title} timeline`}><div className="mock-canvas">
        {option.id === 'lanes' ? <>
          {result.processes.map(p => <div className="mock-lane" key={p.id}><span className="lane-label"><i className={`process-dot ${colorClass(result,p.id)}`} />{p.id}</span><div className="lane-track">
            <div className="lifetime-track" style={{left:`${p.arrival/result.finishTime*100}%`,width:`${(p.completion-p.arrival)/result.finishTime*100}%`}} />
            {result.segments.map((s,i) => s.processId === p.id ? block(s,i,'lane') : null)}</div></div>)}
          {result.idleTime > 0 && <div className="mock-lane"><span className="lane-label">Idle</span><div className="lane-track">{result.segments.map((s,i) => s.processId === null ? block(s,i,'lane') : null)}</div></div>}
          <div className="lane-axis"><Ruler result={result} /></div>
        </> : <><div className={`single-track ${option.id}`}>{result.segments.map((s,i) => block(s,i,option.id))}</div><Ruler result={result} /></>}
      </div></div>
      {option.id === 'lanes' && <p className="lane-note">Faint line: arrival to completion. Colored blocks: CPU service. Gaps along that line: ready and waiting. Only one lane runs at a time.</p>}
      <div className="mock-caption"><span className="mock-selected">Selected: <b>{active.processId ?? 'Idle'} [{active.start}, {active.end})</b></span><span>{result.busyTime} busy / {result.idleTime} idle · Click any slice to compare its presentation.</span></div>
    </section>)}
    <footer className="preview-footer">A and B are now available in the main simulator as CPU rail and Process lanes. C is retained here as an earlier design alternative. All views share the same scheduling rules and calculated results.</footer>
  </main>;
}
