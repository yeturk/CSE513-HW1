import { ALGORITHMS } from '../domain/types';
import type { Algorithm } from '../domain/types';

export interface DraftProcess { key: number; id: string; arrival: string; burst: string }
export const ALGORITHM_INFO: Record<Algorithm, { title: string; detail: string; rule: string }> = {
  FCFS: { title: 'First-Come, First-Served', detail: 'İlk gelen, önce çalışır.', rule: 'Non-preemptive' },
  SJF: { title: 'Shortest Job First', detail: 'Hazır işler arasından en kısa burst seçilir.', rule: 'Non-preemptive' },
  SRTF: { title: 'Shortest Remaining Time First', detail: 'Daha kısa kalan süre varsa çalışan kesilir. Eşitlikte devam eder.', rule: 'Preemptive' },
  RR: { title: 'Round Robin', detail: 'FIFO sırası; her turda en fazla bir quantum.', rule: 'Preemptive' },
};

interface Props {
  rows: DraftProcess[];
  algorithm: Algorithm;
  quantum: string;
  dirty: boolean;
  errors: string[];
  workload: string;
  onField: (key: number, field: 'id' | 'arrival' | 'burst', value: string) => void;
  onRemove: (key: number) => void;
  onAdd: () => void;
  onAlgorithm: (algorithm: Algorithm) => void;
  onQuantum: (value: string) => void;
  onLoad: (name: 'A' | 'B') => void;
  onRun: () => void;
}

export function ProcessEditor(props: Props) {
  const info = ALGORITHM_INFO[props.algorithm];
  return <aside className="editor panel" aria-label="Simülasyon ayarları">
    <form onSubmit={event => { event.preventDefault(); props.onRun(); }} noValidate>
      <div className="panel-heading"><h2>İş yükü</h2><span className="quiet-badge">{props.workload}</span></div>
      <p className="section-intro">Process'leri tanımla, CPU'nun sırasını izle.</p>
      <div className="preset-buttons">
        <button type="button" onClick={() => props.onLoad('A')}>Workload A yükle</button>
        <button type="button" onClick={() => props.onLoad('B')}>Workload B yükle</button>
      </div>
      <div className="input-table-wrap"><table className="input-table">
        <caption className="sr-only">Process girişleri; eşitlikte satır sırası kullanılır.</caption>
        <thead><tr><th>ID</th><th>Arrival</th><th>Burst</th><th><span className="sr-only">Sil</span></th></tr></thead>
        <tbody>{props.rows.map((row, index) => <tr key={row.key}>
          <td><div className="id-field"><span className={`process-dot color-${index % 8}`} />
            <input aria-label={`${index + 1}. process ID`} value={row.id} maxLength={24}
              onChange={e => props.onField(row.key, 'id', e.target.value)} /></div></td>
          <td><input aria-label={`${index + 1}. process arrival`} type="number" min="0" step="1" value={row.arrival}
            onChange={e => props.onField(row.key, 'arrival', e.target.value)} /></td>
          <td><input aria-label={`${index + 1}. process burst`} type="number" min="1" step="1" value={row.burst}
            onChange={e => props.onField(row.key, 'burst', e.target.value)} /></td>
          <td><button type="button" className="remove-button" aria-label={`${index + 1}. process sil`}
            onClick={() => props.onRemove(row.key)}>×</button></td>
        </tr>)}</tbody>
      </table></div>
      <button type="button" className="add-button" disabled={props.rows.length >= 64} onClick={props.onAdd}>＋ Process ekle</button>
      <p className="field-hint">Eşit arrival ve seçim ölçütünde satır sırası geçerlidir.</p>
      <fieldset className="algorithm-fieldset"><legend>Scheduling algoritması</legend>
        <div className="algorithm-grid">{ALGORITHMS.map(algorithm => <button type="button" key={algorithm}
          aria-pressed={props.algorithm === algorithm} onClick={() => props.onAlgorithm(algorithm)}>{algorithm}</button>)}</div>
      </fieldset>
      <div className="algorithm-description"><strong>{info.title}</strong><p>{info.detail}</p><span>{info.rule}</span></div>
      <label className="quantum-field" htmlFor="quantum"><span>RR time quantum<small>Karşılaştırmada da bu değer kullanılır.</small></span>
        <input id="quantum" type="number" min="1" step="1" value={props.quantum} onChange={e => props.onQuantum(e.target.value)} /></label>
      {props.errors.length > 0 && <div className="error-box" role="alert"><strong>Girdileri kontrol et</strong>
        <ul>{props.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
      <button className="run-button" type="submit"><span aria-hidden="true">▶</span> {props.dirty ? 'Yeniden çalıştır' : 'Simülasyonu çalıştır'}</button>
    </form>
    <details className="model-note"><summary>Bu model nasıl çalışır?</summary>
      <p>Tek CPU, process başına tek CPU burst, I/O yok. Context switch süresi 0. Zaman birimleri simülasyona aittir; gerçek saniye değildir.</p>
      <p>Ubuntu'nun gerçek scheduler'ını taklit etmez. En fazla 64 process ve 2.000 RR dilimi desteklenir.</p>
    </details>
  </aside>;
}
