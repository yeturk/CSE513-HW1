import { useState } from 'react';
import type { ProcessMetrics, SimulationResult } from '../domain/types';
import { colorClass } from './Timeline';
import { HelpTooltip } from './ControlTooltip';

export const format = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
const METRICS = [
  { key: 'turnaround', label: 'Turnaround', formula: 'Completion − arrival' },
  { key: 'waiting', label: 'Waiting', formula: 'Turnaround − burst' },
  { key: 'response', label: 'Response', formula: 'First start − arrival' },
] as const;

export function Averages({ result }: { result: SimulationResult }) {
  return <div className="averages-strip">{METRICS.map(metric => <div key={metric.key}>
    <span>Average {metric.label.toLowerCase()} <HelpTooltip label={`Explain ${metric.label.toLowerCase()}`} content={`${metric.formula}. Add this value for all processes and divide by the number of processes.`} /></span><strong>{format(result.averages[metric.key])}<small>units</small></strong>
    <p>{metric.formula}</p>
  </div>)}<div className="context-switch-summary">
    <span>Context switches <HelpTooltip label="Explain context switches" content="Count direct handoffs between different processes. Exclude initial dispatch, transitions to/from idle, and consecutive slices of the same process. Each switch costs 0 time units in this model." /></span>
    <strong>{format(result.contextSwitches)}<small>switches</small></strong><p>Cost per switch: 0 time units</p>
  </div></div>;
}

const COLUMNS = [
  ['id', 'Process'], ['arrival', 'Arrival'], ['burst', 'Burst'], ['firstStart', 'First start'],
  ['completion', 'Completion'], ['turnaround', 'Turnaround'], ['waiting', 'Waiting'], ['response', 'Response'],
] as const;

export function Results({ result, selectedProcessId, onSelectProcess }: {
  result: SimulationResult; selectedProcessId: string | null; onSelectProcess: (id: string | null) => void;
}) {
  const [sort, setSort] = useState<{ key: keyof ProcessMetrics; direction: 'descending' | 'ascending' } | null>(null);
  const rows = sort ? [...result.processes].sort((a, b) => {
    const left = a[sort.key], right = b[sort.key];
    const difference = typeof left === 'number' && typeof right === 'number'
      ? left - right : String(left).localeCompare(String(right), 'en', { numeric: true });
    return sort.direction === 'ascending' ? difference : -difference;
  }) : result.processes;
  return <section className="panel metrics-panel" aria-labelledby="metrics-title">
    <div className="panel-heading"><h2 id="metrics-title">Process metrics</h2><span className="quiet-badge">{result.processes.length} processes</span></div>
    <div className="metrics-order"><span>{sort ? `${COLUMNS.find(([key]) => key === sort.key)![1]} · ${sort.direction}` : 'Input order'} · select a column to sort</span>
      {sort && <button type="button" className="text-button" onClick={() => setSort(null)}>Restore input order</button>}</div>
    <div className="table-scroll" tabIndex={0} aria-label="Process metrics; scroll horizontally if needed"><table className="results-table">
      <caption className="sr-only">{result.algorithm} process results</caption>
      <thead><tr>{COLUMNS.map(([key, label]) => {
        const direction = sort?.key === key && sort.direction === 'descending' ? 'ascending' : 'descending';
        return <th key={key} scope="col" aria-sort={sort?.key === key ? sort.direction : 'none'}>
          <button type="button" className="sort-column" aria-label={`Sort by ${label} ${direction}`} onClick={() => setSort({ key, direction })}>
            {label}<span aria-hidden="true">{sort?.key === key ? sort.direction === 'descending' ? '↓' : '↑' : '↕'}</span>
          </button></th>;
      })}</tr></thead>
      <tbody>{rows.map(p => <tr key={p.id} className={selectedProcessId === p.id ? 'highlighted-process' : ''} data-process-id={p.id}><th scope="row">
        <button type="button" className="process-select" aria-label={`Highlight ${p.id}`} aria-pressed={selectedProcessId === p.id}
          onClick={() => onSelectProcess(selectedProcessId === p.id ? null : p.id)}><span className={`process-dot ${colorClass(result,p.id)}`} />{p.id}</button></th>
        <td>{p.arrival}</td><td>{p.burst}</td><td>{p.firstStart}</td><td>{p.completion}</td><td>{p.turnaround}</td><td>{p.waiting}</td><td>{p.response}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row" colSpan={5}>Average</th><td>{format(result.averages.turnaround)}</td><td>{format(result.averages.waiting)}</td><td>{format(result.averages.response)}</td></tr></tfoot>
    </table></div>
    <p className="chart-note">Response measures the wait for first CPU service; waiting includes all time spent ready. Only displayed averages are rounded.</p>
  </section>;
}

export function Comparison({ results, onCompare, error, expanded }: { results: SimulationResult[] | null; onCompare: () => void; error: string; expanded: boolean }) {
  return <section className="panel comparison-panel" aria-labelledby="comparison-title">
    <div className="panel-heading"><div><h2 id="comparison-title">One workload, four approaches</h2><p className="section-intro">Compare the current inputs. Lower averages are better.</p></div>
      <button type="button" className="secondary-button" aria-expanded={expanded} onClick={onCompare}>{expanded ? 'Hide comparison' : 'Compare algorithms'}</button></div>
    {error && <p role="alert" className="error-box">{error}</p>}
    {results ? <div className="table-scroll" tabIndex={0}><table className="results-table comparison-table">
      <caption className="sr-only">Average times by algorithm; lower is better</caption>
      <thead><tr><th>Algorithm</th>{METRICS.map(m => <th key={m.key}>{m.label}</th>)}</tr></thead>
      <tbody>{results.map(result => <tr key={result.algorithm}><th scope="row">{result.algorithm}{result.quantum !== null && <small> q = {result.quantum}</small>}</th>
        {METRICS.map(metric => {
          const best = result.averages[metric.key] === Math.min(...results.map(r => r.averages[metric.key]));
          return <td key={metric.key} className={best ? 'best-value' : ''}>{format(result.averages[metric.key])}{best && <small>lowest</small>}</td>;
        })}</tr>)}</tbody>
    </table></div> : !error && <p className="comparison-empty">Waiting and response do not always improve together. Compare their trade-offs on the same workload.</p>}
  </section>;
}
