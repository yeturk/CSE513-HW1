import type { SimulationResult } from '../domain/types';
import { colorClass } from './Timeline';

export const format = (value: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(value);
const METRICS = [
  { key: 'turnaround', label: 'Turnaround', formula: 'Completion − arrival' },
  { key: 'waiting', label: 'Waiting', formula: 'Turnaround − burst' },
  { key: 'response', label: 'Response', formula: 'First start − arrival' },
] as const;

export function Averages({ result }: { result: SimulationResult }) {
  return <div className="averages-strip">{METRICS.map(metric => <div key={metric.key}>
    <span>Ortalama {metric.label.toLowerCase()}</span><strong>{format(result.averages[metric.key])}<small>birim</small></strong>
    <p>{metric.formula}</p>
  </div>)}</div>;
}

export function Results({ result }: { result: SimulationResult }) {
  return <section className="panel metrics-panel" aria-labelledby="metrics-title">
    <div className="panel-heading"><h2 id="metrics-title">Process metrikleri</h2><span className="quiet-badge">{result.processes.length} process</span></div>
    <div className="table-scroll" tabIndex={0} aria-label="Metrik tablosu; gerekirse yatay kaydırın"><table className="results-table">
      <caption className="sr-only">{result.algorithm} process sonuçları</caption>
      <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>First start</th><th>Completion</th><th>Turnaround</th><th>Waiting</th><th>Response</th></tr></thead>
      <tbody>{result.processes.map(p => <tr key={p.id}><th scope="row"><span className={`process-dot ${colorClass(result,p.id)}`} />{p.id}</th>
        <td>{p.arrival}</td><td>{p.burst}</td><td>{p.firstStart}</td><td>{p.completion}</td><td>{p.turnaround}</td><td>{p.waiting}</td><td>{p.response}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row" colSpan={5}>Ortalama</th><td>{format(result.averages.turnaround)}</td><td>{format(result.averages.waiting)}</td><td>{format(result.averages.response)}</td></tr></tfoot>
    </table></div>
    <p className="chart-note">Response ilk CPU hizmetini, waiting ise bütün ready beklemelerini ölçer. Yuvarlama yalnızca gösterimde yapılır.</p>
  </section>;
}

export function Comparison({ results, onCompare, error }: { results: SimulationResult[] | null; onCompare: () => void; error: string }) {
  return <section className="panel comparison-panel" aria-labelledby="comparison-title">
    <div className="panel-heading"><div><h2 id="comparison-title">Aynı iş yükü, dört yaklaşım</h2><p className="section-intro">Son çalıştırılan girdiler üzerinden karşılaştır.</p></div>
      <button type="button" className="secondary-button" onClick={onCompare}>Algoritmaları karşılaştır</button></div>
    {error && <p role="alert" className="error-box">{error}</p>}
    {results ? <div className="table-scroll" tabIndex={0}><table className="results-table comparison-table">
      <caption className="sr-only">Algoritmaların ortalama süreleri; düşük değer daha iyi</caption>
      <thead><tr><th>Algoritma</th>{METRICS.map(m => <th key={m.key}>{m.label}</th>)}</tr></thead>
      <tbody>{results.map(result => <tr key={result.algorithm}><th scope="row">{result.algorithm}{result.quantum !== null && <small> q = {result.quantum}</small>}</th>
        {METRICS.map(metric => {
          const best = result.averages[metric.key] === Math.min(...results.map(r => r.averages[metric.key]));
          return <td key={metric.key} className={best ? 'best-value' : ''}>{format(result.averages[metric.key])}{best && <small>en düşük</small>}</td>;
        })}</tr>)}</tbody>
    </table></div> : <p className="comparison-empty">Ortalama waiting ile response her zaman birlikte iyileşmez. Farkı aynı workload üzerinde gör.</p>}
  </section>;
}
