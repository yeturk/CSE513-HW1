import { useLayoutEffect, useRef, useState } from 'react';
import type { Segment, SimulationResult } from '../domain/types';
import { ControlTooltip } from './ControlTooltip';

export function colorClass(result: SimulationResult, id: string | null) {
  return id === null ? 'idle-color' : `color-${result.processes.findIndex(p => p.id === id) % 8}`;
}

export function Timeline({ result, step, onStep, selectedProcessId, onSelectProcess, view, onViewChange }: {
  result: SimulationResult; step: number; onStep: (step: number) => void;
  selectedProcessId: string | null; onSelectProcess: (id: string | null) => void;
  view: 'rail' | 'lanes'; onViewChange: (view: 'rail' | 'lanes') => void;
}) {
  const decision = result.decisions[step];
  const [zoom, setZoom] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    const observer = new ResizeObserver(() => setCanvasWidth(canvas.getBoundingClientRect().width));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const scroll = scrollRef.current!;
    // Zoom/view changes commit before ResizeObserver necessarily delivers its
    // next notification. Use the committed layout for scroll positioning.
    const width = canvasRef.current!.getBoundingClientRect().width;
    if (width !== canvasWidth) setCanvasWidth(width);
    const gutter = view === 'lanes' ? 76 : 0;
    const x = gutter + decision.start / result.finishTime * Math.max(0, width - gutter);
    const leftInset = gutter + 40;
    if (zoom === 1) scroll.scrollLeft = 0;
    else if (x < scroll.scrollLeft + leftInset || x > scroll.scrollLeft + scroll.clientWidth - 40) {
      scroll.scrollLeft = Math.max(0, x - leftInset);
    }
  }, [decision.start, result.finishTime, canvasWidth, zoom, view]);
  const laneGutter = view === 'lanes' ? 76 : 0;
  const trackWidth = Math.max(0, canvasWidth - laneGutter);
  // Keep every boundary mark, but only label times with enough room between them.
  let lastLabelRight = -Infinity;
  const endLabelWidth = String(result.finishTime).length * 8;
  const ticks = [...result.segments.map(s => s.start), result.finishTime].map((time, index) => {
    const x = time / result.finishTime * trackWidth;
    const right = x + String(time).length * 8;
    const last = index === result.segments.length;
    const showLabel = index === 0 || last || (x >= lastLabelRight + 12 && right < trackWidth - endLabelWidth - 12);
    if (showLabel) lastLabelRight = right;
    return { time, last, showLabel };
  });
  function renderSegment(segment: Segment, index: number) {
    const selected = decision.start >= segment.start && decision.start < segment.end;
    const label = `${segment.processId ?? 'Idle'}: ${segment.start}–${segment.end}`;
    const pixels = (segment.end - segment.start) / result.finishTime * trackWidth;
    return <button key={index} type="button" data-process-id={segment.processId ?? ''}
      className={`timeline-segment ${colorClass(result, segment.processId)} ${selected ? 'selected' : ''} ${selectedProcessId !== null && segment.processId === selectedProcessId ? 'highlighted-process' : ''}`}
      style={{ width: `${(segment.end - segment.start) / result.finishTime * 100}%`, ...(view === 'lanes' ? { left: `${segment.start / result.finishTime * 100}%` } : {}) }}
      aria-label={label} title={label} aria-pressed={selected}
      onClick={() => { onStep(result.decisions.findIndex(d => d.start === segment.start)); onSelectProcess(segment.processId); }}>
      {pixels >= 28 && <span>{segment.processId ?? 'Idle'}</span>}{pixels >= 60 && view === 'rail' && <small>{segment.end - segment.start}u</small>}
    </button>;
  }
  return <section className="panel timeline-panel" aria-labelledby="timeline-title">
    <div className="panel-heading"><div><h2 id="timeline-title">CPU timeline</h2><p className="section-intro">Select a slice to explore the scheduling decision.</p></div>
      <span className="quiet-badge">{result.finishTime} time units</span></div>
    <div className="timeline-toolbar">
      <div className="timeline-view-switch" role="group" aria-label="Timeline view">
        <button type="button" aria-pressed={view === 'rail'} onClick={() => onViewChange('rail')}>CPU rail</button>
        <button type="button" aria-pressed={view === 'lanes'} onClick={() => onViewChange('lanes')}>Process lanes</button>
      </div>
      <div className="zoom-controls" role="group" aria-label="Timeline zoom">
        <ControlTooltip content="Fit the complete timeline in the available width."><button type="button" aria-pressed={zoom === 1} onClick={() => setZoom(1)}>Fit</button></ControlTooltip>
        <ControlTooltip content={zoom === 1 ? 'Already showing the full timeline.' : 'Zoom out to see more of the timeline.'}><button type="button" aria-label="Zoom out" disabled={zoom === 1} onClick={() => setZoom(zoom / 2)}>−</button></ControlTooltip>
        <output aria-label="Timeline scale">{zoom * 100}%</output>
        <ControlTooltip content={zoom === 16 ? 'Maximum zoom reached.' : 'Zoom in to read short slices. Time proportions stay the same.'}><button type="button" aria-label="Zoom in" disabled={zoom === 16} onClick={() => setZoom(zoom * 2)}>＋</button></ControlTooltip>
      </div>
      <span className="zoom-hint">{zoom === 1 ? 'Full timeline · zoom for detail' : 'Scroll to explore · proportional time scale'}</span>
    </div>
    <div ref={scrollRef} className="timeline-scroll" tabIndex={0} aria-label="Gantt chart; scroll horizontally if needed">
      <div ref={canvasRef} className={`timeline-canvas view-${view}`} style={{ width: `${zoom * 100}%` }}>
        {view === 'rail' ? <div className="timeline-bars">{result.segments.map(renderSegment)}</div> : <div className="process-lanes">
          {result.processes.map(p => <div className="process-lane" key={p.id}>
            <button type="button" className="lane-process-label" title={p.id} aria-label={`Highlight lane ${p.id}`} aria-pressed={selectedProcessId === p.id}
              onClick={() => onSelectProcess(selectedProcessId === p.id ? null : p.id)}><i className={`process-dot ${colorClass(result,p.id)}`} /><span>{p.id}</span></button>
            <div className="process-lane-track"><div className="process-lifetime" style={{ left: `${p.arrival/result.finishTime*100}%`, width: `${(p.completion-p.arrival)/result.finishTime*100}%` }} />
              {result.segments.map((s,i) => s.processId === p.id ? renderSegment(s,i) : null)}</div>
          </div>)}
          {result.idleTime > 0 && <div className="process-lane"><span className="lane-process-label">Idle</span><div className="process-lane-track">{result.segments.map((s,i) => s.processId === null ? renderSegment(s,i) : null)}</div></div>}
        </div>}
        <div className="timeline-ruler" style={{ marginLeft: laneGutter }} aria-hidden="true">{ticks.map(({ time, last, showLabel }) =>
          <span key={time} className={last ? 'last-tick' : ''} style={{ left: `${time / result.finishTime * 100}%` }}>{showLabel ? time : ''}</span>)}</div>
        <div className="time-cursor" style={{ left: `calc(${laneGutter}px + (100% - ${laneGutter}px) * ${decision.start / result.finishTime})` }} aria-hidden="true" />
      </div>
    </div>
    {view === 'lanes' && <p className="chart-note">Faint line: arrival to completion. Colored blocks: CPU service. Gaps along the line: ready and waiting. All rows share one CPU and one clock.</p>}
    <div className="chart-footer"><div className="legend" role="group" aria-label="Highlight a process">{result.processes.map(p =>
      <button key={p.id} type="button" className="process-select" aria-pressed={selectedProcessId === p.id}
        onClick={() => onSelectProcess(selectedProcessId === p.id ? null : p.id)}><i className={`process-dot ${colorClass(result, p.id)}`} />{p.id}</button>)}
      {result.idleTime > 0 && <span><i className="process-dot idle-color" />Idle</span>}</div>
      <span>{result.busyTime} busy / {result.idleTime} idle</span></div>
    <div className="highlight-status"><span>{selectedProcessId ? `Highlighting ${selectedProcessId} across the timeline and metrics.` : 'Select a process label to highlight its slices and metrics.'}</span>
      {selectedProcessId && <button type="button" onClick={() => onSelectProcess(null)}>Clear highlight</button>}</div>
    {result.algorithm === 'RR' && <p className="chart-note">Each block is a CPU slice. Quantum boundaries remain visible even when the same process runs again.</p>}
    <div className="decision-view">
      <div className="decision-top"><h3>Explore the decision <span>{step + 1} / {result.decisions.length}</span></h3>
        <div className="step-buttons"><ControlTooltip content={step === 0 ? 'This is the first scheduling decision.' : 'Inspect the previous scheduling decision.'}><button type="button" disabled={step === 0} onClick={() => onStep(step - 1)} aria-label="Previous decision">←</button></ControlTooltip>
          <ControlTooltip content={step === result.decisions.length - 1 ? 'This is the last scheduling decision.' : 'Inspect the next scheduling decision and ready queue.'}><button type="button" disabled={step === result.decisions.length - 1} onClick={() => onStep(step + 1)} aria-label="Next decision">→</button></ControlTooltip></div></div>
      <label className="sr-only" htmlFor="decision-step">Decision step</label>
      <input id="decision-step" className="step-range" type="range" min="0" max={result.decisions.length - 1} value={step}
        onChange={e => onStep(Number(e.target.value))} />
      <div className="decision-content" aria-live="polite">
        <div className="decision-time">t = {decision.start}<small>{decision.start}–{decision.end}</small></div>
        <div><p className="decision-explanation">{decision.explanation}</p>
          <p className="queue-label">{result.algorithm === 'RR' ? 'FIFO queue before selection · front on the left' : 'Ready candidates before selection · numbers show remaining time'}</p>
          <div className="queue-chips">{decision.candidates.length ? decision.candidates.map(p =>
            <span key={p.id} className={`queue-chip ${colorClass(result, p.id)} ${p.id === decision.processId ? 'running' : ''}`}>
              {p.id}<b>{p.remaining}</b>{p.id === decision.processId && <span className="sr-only"> selected</span>}
            </span>) : <span className="muted">The queue is empty</span>}</div>
          <p className="decision-outcome">{decision.outcome}</p>
        </div>
      </div>
    </div>
  </section>;
}
