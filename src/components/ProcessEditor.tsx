import { ALGORITHMS } from '../domain/types';
import { useState } from 'react';
import { PRESETS } from '../domain/workloads';
import type { SavedWorkload } from '../domain/savedWorkloads';
import { ControlTooltip, HelpTooltip } from './ControlTooltip';
import type { Algorithm } from '../domain/types';

export interface DraftProcess { key: number; id: string; arrival: string; burst: string }
export const ALGORITHM_INFO: Record<Algorithm, { title: string; detail: string; rule: string }> = {
  FCFS: { title: 'First-Come, First-Served', detail: 'The first process to arrive runs first.', rule: 'Non-preemptive' },
  SJF: { title: 'Shortest Job First', detail: 'Select the shortest burst among ready processes.', rule: 'Non-preemptive' },
  SRTF: { title: 'Shortest Remaining Time First', detail: 'Preempt for a strictly shorter remaining time. Keep running on a tie.', rule: 'Preemptive' },
  RR: { title: 'Round Robin', detail: 'FIFO order, with up to one quantum per turn.', rule: 'Preemptive' },
};

interface Props {
  rows: DraftProcess[];
  algorithm: Algorithm;
  quantum: string;
  errors: string[];
  workload: string;
  presetId: string;
  savedWorkloads: SavedWorkload[];
  saveMessage: string;
  onSave: (name: string) => boolean;
  onDeleteSaved: () => void;
  onField: (key: number, field: 'id' | 'arrival' | 'burst', value: string) => void;
  onRemove: (key: number) => void;
  onAdd: () => void;
  onAlgorithm: (algorithm: Algorithm) => void;
  onQuantum: (value: string) => void;
  onLoad: (name: string) => void;
}

export function ProcessEditor(props: Props) {
  const info = ALGORITHM_INFO[props.algorithm];
  const [saveName, setSaveName] = useState('');
  const preset = PRESETS.find(p => p.id === props.presetId);
  return <aside className="editor panel" aria-label="Simulation settings">
    <form onSubmit={event => event.preventDefault()} noValidate>
      <div className="panel-heading"><h2>Set up your experiment</h2><span className="quiet-badge">{props.rows.length} processes</span></div>
      <label className="library-label" htmlFor="workload-library">Workload library</label>
      <select id="workload-library" value={props.presetId} onChange={e => props.onLoad(e.target.value)}>
        <option value="" disabled>Custom workload</option>
        {['Assignment', 'Explore'].map(category => <optgroup key={category} label={category}>{PRESETS.filter(p => p.category === category).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
        {props.savedWorkloads.length > 0 && <optgroup label="Saved in this browser">{props.savedWorkloads.map(p => <option key={p.id} value={`saved:${p.id}`}>{p.name}</option>)}</optgroup>}
      </select>
      <p className="preset-description">{preset?.description ?? 'Edit the processes below. Save a named copy to return to this experiment later.'}</p>
      <div className="preset-buttons">
        <button type="button" onClick={() => props.onLoad('A')}>Load workload A</button>
        <button type="button" onClick={() => props.onLoad('B')}>Load workload B</button>
      </div>
      <div className="input-table-wrap"><table className="input-table">
        <caption className="sr-only">Process inputs; input order breaks ties.</caption>
        <thead><tr><th>ID</th><th>Arrival <HelpTooltip label="Explain arrival time" content="The time a process becomes ready. It cannot run before this time." /></th><th>Burst <HelpTooltip label="Explain CPU burst" content="The total CPU time this process needs. Waiting time is not part of its burst." /></th><th><span className="sr-only">Remove</span></th></tr></thead>
        <tbody>{props.rows.map((row, index) => <tr key={row.key}>
          <td><div className="id-field"><span className={`process-dot color-${index % 8}`} />
            <input aria-label={`Process ${index + 1} ID`} value={row.id} maxLength={24}
              onChange={e => props.onField(row.key, 'id', e.target.value)} /></div></td>
          <td><input aria-label={`Process ${index + 1} arrival`} type="number" min="0" step="1" value={row.arrival}
            onChange={e => props.onField(row.key, 'arrival', e.target.value)} /></td>
          <td><input aria-label={`Process ${index + 1} burst`} type="number" min="1" step="1" value={row.burst}
            onChange={e => props.onField(row.key, 'burst', e.target.value)} /></td>
          <td><ControlTooltip content={`Remove ${row.id || `row ${index + 1}`} from this workload.`}><button type="button" className="remove-button" aria-label={`Remove process ${index + 1}`}
            onClick={() => props.onRemove(row.key)}>×</button></ControlTooltip></td>
        </tr>)}</tbody>
      </table></div>
      <button type="button" className="add-button" disabled={props.rows.length >= 64} onClick={props.onAdd}>＋ Add process</button>
      <details className="save-workload"><summary>Save or manage workloads</summary><label htmlFor="workload-name">Name this workload</label>
        <div className="save-row"><input id="workload-name" value={saveName} maxLength={48} placeholder="e.g. My exam practice" onChange={e => setSaveName(e.target.value)} />
          <button type="button" className="secondary-button" onClick={() => { if (props.onSave(saveName)) setSaveName(''); }}>Save copy</button></div>
        <p>Saved only in this browser. Export results for a portable copy.</p>
        {props.presetId.startsWith('saved:') && <button type="button" className="text-button" onClick={props.onDeleteSaved}>Remove saved copy</button>}
      </details>
      {props.saveMessage && <p className="save-message" role="status">{props.saveMessage}</p>}
      <p className="field-hint">Ties: earlier arrival, then input order. Equal remaining time never interrupts the running process.</p>
      <fieldset className="algorithm-fieldset"><legend>Scheduling algorithm</legend>
        <div className="algorithm-grid">{ALGORITHMS.map(algorithm => <ControlTooltip key={algorithm} content={`${ALGORITHM_INFO[algorithm].title}. ${ALGORITHM_INFO[algorithm].detail}`}><button type="button"
          aria-pressed={props.algorithm === algorithm} onClick={() => props.onAlgorithm(algorithm)}>{algorithm}</button></ControlTooltip>)}</div>
      </fieldset>
      <div className="algorithm-description"><strong>{info.title}</strong><p>{info.detail}</p><span>{info.rule}</span></div>
      <label className="quantum-field" htmlFor="quantum"><span>RR time quantum<small>Also used when comparing algorithms.</small></span>
        <input id="quantum" type="number" min="1" step="1" value={props.quantum} onChange={e => props.onQuantum(e.target.value)} /></label>
      <div className="quantum-presets" role="group" aria-label="Quick RR quantum">
        {[1, 2, 4].map(q => <button key={q} type="button" aria-pressed={Number(props.quantum) === q}
          onClick={() => props.onQuantum(String(q))}>q = {q}</button>)}
      </div>
      {props.errors.length > 0 && <div className="error-box" role="alert"><strong>Check your inputs</strong>
        <ul>{props.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
      <p className="auto-status"><span aria-hidden="true">●</span> {props.errors.length ? 'Waiting for valid inputs' : 'Live results'}<small>Changes are calculated automatically.</small></p>
    </form>
    <details className="model-note"><summary>How does this model work?</summary>
      <p>One CPU, one burst per process, no I/O, and zero context-switch cost. Time units are simulated, not real seconds.</p>
      <p>This does not reproduce Ubuntu’s actual scheduler. Supports up to 64 processes and 2,000 RR slices.</p>
    </details>
  </aside>;
}
