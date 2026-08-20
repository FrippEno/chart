import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db/client';
import { createEntry } from '../../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    if (!data.chart_id || !data.entry_date || data.score === undefined || data.score === '') {
      return new Response(JSON.stringify({ error: 'chart_id, entry_date, and score are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(locals.runtime?.env);
    const id = await createEntry(db, {
      chart_id: Number(data.chart_id),
      entry_date: data.entry_date,
      score: Number(data.score),
      annotation: data.annotation || null,
    });

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create entry error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
