// Chart Query Functions for chart-tracker
import type { D1Database, Chart, ChartWithCount, ChartEntry, ChartValueType } from './types';
import { safeQuery } from './client';

export async function getAllCharts(db: D1Database): Promise<ChartWithCount[]> {
  return safeQuery(async () => {
    const result = await db
      .prepare(`
        SELECT c.*, COUNT(e.id) as entry_count
        FROM charts c
        LEFT JOIN chart_entries e ON e.chart_id = c.id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `)
      .all<ChartWithCount>();
    return result.results || [];
  }, 'Failed to fetch charts');
}

export async function getChartById(db: D1Database, id: number): Promise<Chart | null> {
  return safeQuery(async () => {
    return db.prepare('SELECT * FROM charts WHERE id = ?').bind(id).first<Chart>();
  }, `Failed to fetch chart: ${id}`);
}

export async function createChart(
  db: D1Database,
  data: {
    title: string;
    x_axis_label: string;
    y_axis_label: string;
    y_min: number;
    y_max: number;
    date_start: string;
    date_end: string;
    goal_score?: number | null;
    goal_date?: string | null;
    color?: string | null;
    value_type?: ChartValueType;
  }
): Promise<number> {
  return safeQuery(async () => {
    const now = new Date().toISOString();
    await db
      .prepare(`
        INSERT INTO charts (title, x_axis_label, y_axis_label, y_min, y_max, date_start, date_end, goal_score, goal_date, color, value_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(data.title, data.x_axis_label, data.y_axis_label, data.y_min, data.y_max, data.date_start, data.date_end, data.goal_score ?? null, data.goal_date ?? null, data.color ?? null, data.value_type ?? 'number', now, now)
      .run();
    const idResult = await db.prepare('SELECT last_insert_rowid() as id').first<{ id: number }>();
    return idResult?.id || 0;
  }, 'Failed to create chart');
}

export async function updateChart(
  db: D1Database,
  id: number,
  data: {
    title?: string;
    x_axis_label?: string;
    y_axis_label?: string;
    y_min?: number;
    y_max?: number;
    date_start?: string;
    date_end?: string;
    goal_score?: number | null;
    goal_date?: string | null;
    color?: string | null;
    value_type?: ChartValueType;
  }
): Promise<void> {
  return safeQuery(async () => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    for (const key of ['title', 'x_axis_label', 'y_axis_label', 'y_min', 'y_max', 'date_start', 'date_end', 'goal_score', 'goal_date', 'color', 'value_type'] as const) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.prepare(`UPDATE charts SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }, `Failed to update chart: ${id}`);
}

export async function deleteChart(db: D1Database, id: number): Promise<void> {
  return safeQuery(async () => {
    await db.prepare('DELETE FROM charts WHERE id = ?').bind(id).run();
  }, `Failed to delete chart: ${id}`);
}

export async function getEntriesForChart(db: D1Database, chartId: number): Promise<ChartEntry[]> {
  return safeQuery(async () => {
    const result = await db
      .prepare('SELECT * FROM chart_entries WHERE chart_id = ? ORDER BY entry_date ASC')
      .bind(chartId)
      .all<ChartEntry>();
    return result.results || [];
  }, `Failed to fetch entries for chart: ${chartId}`);
}

export async function createEntry(
  db: D1Database,
  data: { chart_id: number; entry_date: string; score: number; annotation?: string | null }
): Promise<number> {
  return safeQuery(async () => {
    const now = new Date().toISOString();
    await db
      .prepare(`
        INSERT INTO chart_entries (chart_id, entry_date, score, annotation, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(data.chart_id, data.entry_date, data.score, data.annotation ?? null, now, now)
      .run();
    const idResult = await db.prepare('SELECT last_insert_rowid() as id').first<{ id: number }>();
    return idResult?.id || 0;
  }, 'Failed to create entry');
}

export async function createEntriesBulk(
  db: D1Database,
  chartId: number,
  entries: { entry_date: string; score: number; annotation?: string | null }[]
): Promise<number> {
  return safeQuery(async () => {
    const now = new Date().toISOString();
    const statements = entries.map(e =>
      db.prepare(`
        INSERT INTO chart_entries (chart_id, entry_date, score, annotation, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(chartId, e.entry_date, e.score, e.annotation ?? null, now, now)
    );
    await db.batch(statements);
    return entries.length;
  }, 'Failed to bulk-import entries');
}

export async function updateEntry(
  db: D1Database,
  id: number,
  data: { entry_date?: string; score?: number; annotation?: string | null }
): Promise<void> {
  return safeQuery(async () => {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.entry_date !== undefined) {
      fields.push('entry_date = ?');
      values.push(data.entry_date);
    }
    if (data.score !== undefined) {
      fields.push('score = ?');
      values.push(data.score);
    }
    if (data.annotation !== undefined) {
      fields.push('annotation = ?');
      values.push(data.annotation);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.prepare(`UPDATE chart_entries SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }, `Failed to update entry: ${id}`);
}

export async function deleteEntry(db: D1Database, id: number): Promise<void> {
  return safeQuery(async () => {
    await db.prepare('DELETE FROM chart_entries WHERE id = ?').bind(id).run();
  }, `Failed to delete entry: ${id}`);
}

export async function deleteAllEntriesForChart(db: D1Database, chartId: number): Promise<void> {
  return safeQuery(async () => {
    await db.prepare('DELETE FROM chart_entries WHERE chart_id = ?').bind(chartId).run();
  }, `Failed to reset entries for chart: ${chartId}`);
}
