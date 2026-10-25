export const ALGORITHMS = ['FCFS', 'SJF', 'SRTF', 'RR'] as const;
export type Algorithm = (typeof ALGORITHMS)[number];

export interface ProcessInput {
  id: string;
  arrival: number;
  burst: number;
}

export interface Segment {
  processId: string | null;
  start: number;
  end: number;
}

export interface Candidate {
  id: string;
  remaining: number;
}

export interface Decision extends Segment {
  candidates: Candidate[];
  explanation: string;
  outcome: string;
}

export interface ProcessMetrics extends ProcessInput {
  firstStart: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

export interface SimulationResult {
  algorithm: Algorithm;
  quantum: number | null;
  processes: ProcessMetrics[];
  segments: Segment[];
  decisions: Decision[];
  averages: { turnaround: number; waiting: number; response: number };
  finishTime: number;
  busyTime: number;
  idleTime: number;
  contextSwitches: number;
}
