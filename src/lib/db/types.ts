// Database Types for chart-tracker

export interface Chart {
  id: number;
  title: string;
  x_axis_label: string;
  y_axis_label: string;
  y_min: number;
  y_max: number;
  date_start: string;
  date_end: string;
  created_at: string;
  updated_at: string;
}

export interface ChartWithCount extends Chart {
  entry_count: number;
}

export interface ChartEntry {
  id: number;
  chart_id: number;
  entry_date: string;
  score: number;
  annotation: string | null;
  created_at: string;
  updated_at: string;
}

// D1 Database type from Cloudflare Workers
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
    changes?: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}
