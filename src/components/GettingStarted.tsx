import { useEffect, useRef, useState } from 'react';

export const TOUR_KEY = 'scheduling-lab-tour-v1';
export function needsTour() {
  try { return localStorage.getItem(TOUR_KEY) !== 'seen'; } catch { return false; }
}
const steps = [
  { title: 'Your first CPU scheduling experiment', description: 'A process arrives, waits for the CPU, runs, and finishes. This lab lets you see every scheduling decision.', note: 'Start with Workload A. All results update as you change an input.', visual: 'processes' },
  { title: 'Choose who runs next', description: 'FCFS follows arrivals. SJF selects the shortest ready burst. SRTF can interrupt for a shorter remaining time. Round Robin rotates a FIFO queue.', note: 'For Round Robin, quantum is the maximum CPU time allowed in one turn.', visual: 'algorithms' },
  { title: 'Trace a decision, not just an answer', description: 'Select a Gantt slice or use Previous / Next to inspect the clock, ready candidates, and reason for the choice.', note: 'A wider block means more CPU time. Hatched blocks mean the CPU is idle.', visual: 'timeline' },
  { title: 'Read, compare, and explain', description: 'Turnaround is total time from arrival to completion. Waiting counts time ready but not running. Response is the wait for first CPU service.', note: 'Compare algorithms on the same workload. A lower waiting time does not always mean a lower response time.', visual: 'metrics' },
];

export function GettingStarted({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => { heading.current?.focus(); }, [step]);
  function close() {
    try { localStorage.setItem(TOUR_KEY, 'seen'); } catch { /* Tour remains available without storage. */ }
    onClose();
  }
  const current = steps[step];
  return <dialog ref={dialog} className="tour-dialog" aria-labelledby="tour-title" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="tour-top"><span>Getting started</span><button type="button" onClick={close} aria-label="Close guide">×</button></div>
    <div className="tour-visual" aria-hidden="true">
      {current.visual === 'processes' && <div className="tour-processes"><div><i className="color-0" />P1<span>Arrives at 0</span><b>8 units</b></div><div><i className="color-1" />P2<span>Arrives at 1</span><b>4 units</b></div><div><i className="color-2" />P3<span>Arrives at 2</span><b>2 units</b></div></div>}
      {current.visual === 'algorithms' && <div className="tour-policies"><span>FCFS<small>Arrival order</small></span><span>SJF<small>Shortest burst</small></span><span>SRTF<small>Shortest remaining</small></span><span>RR<small>Take turns</small></span></div>}
      {current.visual === 'timeline' && <div className="tour-chart"><div className="color-0">P1</div><div className="color-1">P2</div><div className="color-2">P3</div><div className="idle-color">Idle</div><span>Read the timeline from left to right</span></div>}
      {current.visual === 'metrics' && <div className="tour-formulas"><span>Turnaround<b>completion − arrival</b></span><span>Waiting<b>turnaround − burst</b></span><span>Response<b>first start − arrival</b></span></div>}
    </div>
    <div className="tour-copy"><p className="tour-progress">Step {step + 1} of {steps.length}</p><h2 ref={heading} tabIndex={-1} id="tour-title">{current.title}</h2><p>{current.description}</p><aside>{current.note}</aside></div>
    <div className="tour-bottom"><button type="button" className="text-button" onClick={close}>Skip guide</button><div>
      {step > 0 && <button type="button" className="secondary-button" onClick={() => setStep(step - 1)}>Back</button>}
      <button type="button" className="primary-button" onClick={() => step === steps.length - 1 ? close() : setStep(step + 1)}>{step === steps.length - 1 ? 'Start exploring' : 'Next'}</button>
    </div></div>
  </dialog>;
}
