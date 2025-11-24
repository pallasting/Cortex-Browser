export enum ViewMode {
  WEB = 'WEB',
  DATA = 'DATA', // The "Arrow" View
  MEMORY = 'MEMORY', // The "LanceDB" Vector View
}

export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  // In a real Rust app, this would be a pointer to the Arrow RecordBatch
  dataState: 'raw' | 'parsed' | 'vectorized';
  tokenCount: number;
}

export interface ArrowColumn {
  name: string;
  type: 'Utf8' | 'UInt64' | 'Float32' | 'Boolean';
  data: (string | number | boolean)[];
}

export interface DataFrame {
  columns: ArrowColumn[];
  rowCount: number;
}

export interface VectorNode {
  id: string;
  title: string;
  url: string;
  similarity: number; // 0 to 1
  x?: number;
  y?: number;
}

export interface VectorLink {
  source: string;
  target: string;
  value: number;
}

export interface VectorGraphData {
  nodes: VectorNode[];
  links: VectorLink[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
