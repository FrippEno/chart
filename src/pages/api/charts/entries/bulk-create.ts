import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db/client';
import { createEntriesBulk } from '../../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    if (!data.chart_id || !Array.isArray(data.entries) || data.entries.length === 0) {
      return new Response(JSON.stringify({ error: 'chart_id and a non-empty entries array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleaned: { entry_date: string; score: number; annotation: string | null }[] = [];
    for (const row of data.entries) {
      if (!row.entry_date || row.score === undefined || row.score === null || row.score === '') {
        return new Response(JSON.stringify({ error: 'Each entry needs entry_date and score' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const score = Number(row.score);
      if (Number.isNaN(score)) {
        return new Response(JSON.stringify({ error: `Invalid score: ${row.score}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      cleaned.push({ entry_date: row.entry_date, score, annotation: row.annotation || null });
    }

    const db = getDB(locals.runtime?.env);
    const count = await createEntriesBulk(db, Number(data.chart_id), cleaned);

    return new Response(JSON.stringify({ success: true, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bulk create entries error:', error);
    return new Response(JSON.stringify({ error: 'Failed to import entries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
