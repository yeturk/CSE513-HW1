import { useEffect, useRef } from 'react';
import { LIMITS } from '../domain/scheduler';

export function Rules({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="rules-dialog" aria-labelledby="rules-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="rules-heading"><div><h2 id="rules-title">Scheduling rules</h2><p>The model behind every result in this lab.</p></div>
      <button type="button" className="close-rules" aria-label="Close rules" onClick={onClose}>×</button></div>
    <div className="rules-body">
      <section><h3>One CPU, simulated time</h3><p>Each process has one CPU burst and no I/O. Context switching costs zero time. The CPU runs a ready process whenever one exists; otherwise it stays idle until the next arrival. This is a policy simulator, not Ubuntu’s actual scheduler.</p></section>
      <section><h3>How the next process is chosen</h3><dl className="rules-policies">
        <div><dt>FCFS</dt><dd>Run the earliest-arriving ready process to completion.</dd></div>
        <div><dt>SJF</dt><dd>When the CPU becomes free, choose the shortest burst among ready processes. A new arrival cannot interrupt it.</dd></div>
        <div><dt>SRTF</dt><dd>Choose the shortest remaining CPU time. Preempt only for a strictly shorter remainder. On an equal remainder, keep the current process running.</dd></div>
        <div><dt>Round Robin</dt><dd>Use a FIFO queue and run for at most one quantum per turn. At a quantum boundary, enqueue arrivals at that exact time before re-enqueuing the unfinished runner. Completed processes never rejoin.</dd></div>
      </dl><p className="rules-callout"><strong>Selection ties:</strong> earlier arrival, then earlier position in the input list. Process ID does not decide the order.</p></section>
      <section><h3>Reading time and metrics</h3><p>An interval [2, 5) gives 3 CPU units. Consecutive RR slices stay separate even when the same process runs again.</p>
        <ul><li><strong>Turnaround</strong> = completion − arrival</li><li><strong>Waiting</strong> = turnaround − CPU burst</li><li><strong>Response</strong> = first start − arrival</li></ul>
        <p>In Process lanes, faint lines span arrival to completion. Colored blocks are CPU service; gaps along the faint line are ready-queue waiting. Rows are not separate CPUs.</p></section>
      <section><h3>Valid inputs and limits</h3><p>IDs must be unique after trimming spaces (case-sensitive). Arrivals are nonnegative integers; bursts and quantum are positive integers. Invalid inputs clear affected results and show an explanation.</p>
        <p>Up to {LIMITS.processes} processes, 24 characters per ID, maximum arrival plus total burst of {LIMITS.time.toLocaleString('en-US')} units, and {LIMITS.slices.toLocaleString('en-US')} RR slices. Increase quantum if the slice limit is exceeded.</p></section>
    </div><div className="rules-footer"><button type="button" className="primary-button" onClick={onClose}>Back to the lab</button></div>
  </dialog>;
}
