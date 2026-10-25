import type { SimulationResult } from '../domain/types';

export function colorClass(result: SimulationResult, id: string | null) {
  return id === null ? 'idle-color' : `color-${result.processes.findIndex(p => p.id === id) % 8}`;
}

export function Timeline({ result, step, onStep }: { result: SimulationResult; step: number; onStep: (step: number) => void }) {
  const decision = result.decisions[step];
  const width = Math.min(2200, Math.max(640, result.finishTime * 46));
  return <section className="panel timeline-panel" aria-labelledby="timeline-title">
    <div className="panel-heading"><div><h2 id="timeline-title">CPU zaman çizelgesi</h2><p className="section-intro">Bir aralığa tıkla, seçim nedenini incele.</p></div>
      <span className="quiet-badge">{result.finishTime} zaman birimi</span></div>
    <div className="timeline-scroll" tabIndex={0} aria-label="Gantt chart; gerekirse yatay kaydırın">
      <div className="timeline-canvas" style={{ width, minWidth: '100%' }}>
        <div className="timeline-bars">{result.segments.map((segment, index) => {
          const selected = decision.start >= segment.start && decision.start < segment.end;
          const label = `${segment.processId ?? 'Idle'}: ${segment.start}–${segment.end}`;
          return <button key={index} type="button" className={`timeline-segment ${colorClass(result, segment.processId)} ${selected ? 'selected' : ''}`}
            style={{ width: `${(segment.end - segment.start) / result.finishTime * 100}%` }} aria-label={label} title={label}
            aria-pressed={selected} onClick={() => onStep(result.decisions.findIndex(d => d.start === segment.start))}>
            <span>{segment.processId ?? 'Idle'}</span><small>{segment.end - segment.start} birim</small>
          </button>;
        })}</div>
        <div className="timeline-ruler" aria-hidden="true">{[...result.segments.map(s => s.start), result.finishTime].map((time, i) =>
          <span key={time} className={i === result.segments.length ? 'last-tick' : ''} style={{ left: `${time / result.finishTime * 100}%` }}>{time}</span>)}</div>
        <div className="time-cursor" style={{ left: `${decision.start / result.finishTime * 100}%` }} aria-hidden="true" />
      </div>
    </div>
    <div className="chart-footer"><div className="legend">{result.processes.map(p => <span key={p.id}><i className={`process-dot ${colorClass(result, p.id)}`} />{p.id}</span>)}
      {result.idleTime > 0 && <span><i className="process-dot idle-color" />Idle</span>}</div>
      <span>{result.busyTime} çalışma / {result.idleTime} idle</span></div>
    {result.algorithm === 'RR' && <p className="chart-note">Her blok bir CPU dilimidir. Aynı process art arda seçilse de quantum sınırları korunur.</p>}
    <div className="decision-view">
      <div className="decision-top"><h3>Kararı incele <span>{step + 1} / {result.decisions.length}</span></h3>
        <div className="step-buttons"><button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} aria-label="Önceki karar">←</button>
          <button type="button" disabled={step === result.decisions.length - 1} onClick={() => onStep(step + 1)} aria-label="Sonraki karar">→</button></div></div>
      <label className="sr-only" htmlFor="decision-step">Karar adımı</label>
      <input id="decision-step" className="step-range" type="range" min="0" max={result.decisions.length - 1} value={step}
        onChange={e => onStep(Number(e.target.value))} />
      <div className="decision-content" aria-live="polite">
        <div className="decision-time">t = {decision.start}<small>{decision.start}–{decision.end}</small></div>
        <div><p className="decision-explanation">{decision.explanation}</p>
          <p className="queue-label">{result.algorithm === 'RR' ? 'Seçim öncesi FIFO kuyruğu · baş solda' : 'Seçim öncesi hazır adaylar · sayılar kalan süre'}</p>
          <div className="queue-chips">{decision.candidates.length ? decision.candidates.map(p =>
            <span key={p.id} className={`queue-chip ${colorClass(result, p.id)} ${p.id === decision.processId ? 'running' : ''}`}>
              {p.id}<b>{p.remaining}</b>{p.id === decision.processId && <span className="sr-only"> seçildi</span>}
            </span>) : <span className="muted">Kuyruk boş</span>}</div>
          <p className="decision-outcome">{decision.outcome}</p>
        </div>
      </div>
    </div>
  </section>;
}
