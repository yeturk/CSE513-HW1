import { useEffect, useRef, useState } from 'react';

export const TOUR_KEY = 'scheduling-lab-tour-v1';
export function needsTour() {
  try { return localStorage.getItem(TOUR_KEY) !== 'seen'; } catch { return false; }
}
const steps = [
  { title: 'Your first CPU scheduling experiment', description: 'Start with Workload A, edit a row, or choose Add Random Process to add one job at a time. All results update automatically.', note: 'Random arrival: 0 to 1.5 × the current maximum, rounded down. Random burst: 1 to 2 × the current maximum. Bounds include both ends and respect simulation limits. An empty list starts with arrival 0 and burst 1–2.', visual: 'processes' },
  { title: 'Choose who runs next', description: 'FCFS follows arrivals. SJF selects the shortest ready burst. SRTF can interrupt for a shorter remaining time. Round Robin rotates a FIFO queue.', note: 'Quantum limits each RR turn. Open Rules in the header for selection ties, arrivals at quantum boundaries, and metric formulas.', visual: 'algorithms' },
  { title: 'One schedule, two views', description: 'CPU rail shows execution in one row. Process lanes separates each process on the same clock. Both show the same single-CPU schedule.', note: 'Select a colored slice or use Previous / Next to inspect the ready queue and decision. Wider blocks mean more CPU time; gaps along a faint lane line mean waiting. Hatched blocks mean idle CPU time.', visual: 'timeline' },
  { title: 'Read, compare, and explain', description: 'Turnaround is total time from arrival to completion. Waiting counts time ready but not running. Response is the wait for first CPU service.', note: 'Sort metrics by clicking a column; Restore input order resets the table. Context switches count direct changes between different processes and cost zero time here. Compare algorithms on the same workload, then save a named copy or export results to keep your experiment.', visual: 'metrics' },
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
