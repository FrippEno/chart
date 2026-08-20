import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db/client';
import { updateEntry } from '../../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    if (!data.id) {
      return new Response(JSON.stringify({ error: 'Entry ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(locals.runtime?.env);
    await updateEntry(db, data.id, {
      entry_date: data.entry_date,
      score: data.score !== undefined ? Number(data.score) : undefined,
      annotation: data.annotation !== undefined ? (data.annotation || null) : undefined,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update entry error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
