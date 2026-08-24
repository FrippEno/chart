import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db/client';
import { deleteAllEntriesForChart } from '../../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    if (!data.chart_id) {
      return new Response(JSON.stringify({ error: 'Chart ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(locals.runtime?.env);
    await deleteAllEntriesForChart(db, data.chart_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Clear entries error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset chart data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
