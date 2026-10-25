import { LIMITS, validateInput } from './scheduler';
import { ALGORITHMS } from './types';
import type { Algorithm, ProcessInput } from './types';

export interface SavedWorkload { id: string; name: string; processes: ProcessInput[]; algorithm: Algorithm; quantum: number }
export const SAVED_WORKLOADS_KEY = 'scheduling-lab-workloads-v1';
export const MAX_SAVED_WORKLOADS = 12;

/** Browser storage is untrusted: keep only small, fully validated records. */
export function decodeSavedWorkloads(raw: string | null): SavedWorkload[] {
  if (!raw || raw.length > 200_000) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid: SavedWorkload[] = [];
    for (const item of parsed.slice(0, MAX_SAVED_WORKLOADS)) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^[\w-]{1,64}$/.test(item.id)
        || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 48
        || !ALGORITHMS.includes(item.algorithm) || !Number.isSafeInteger(item.quantum) || item.quantum < 1 || item.quantum > LIMITS.time
        || !Array.isArray(item.processes) || item.processes.length > LIMITS.processes) continue;
      if (item.processes.some((p: unknown) => !p || typeof p !== 'object' || !('id' in p) || typeof p.id !== 'string'
        || !('arrival' in p) || typeof p.arrival !== 'number' || !('burst' in p) || typeof p.burst !== 'number')) continue;
      if (validateInput(item.processes, item.algorithm, item.quantum).length) continue;
      if (valid.some(p => p.id === item.id || p.name.toLowerCase() === item.name.trim().toLowerCase())) continue;
      valid.push({ id: item.id, name: item.name.trim(), algorithm: item.algorithm, quantum: item.quantum,
        processes: item.processes.map((p: ProcessInput) => ({ id: p.id.trim(), arrival: p.arrival, burst: p.burst })) });
    }
    return valid;
  } catch { return []; }
}
