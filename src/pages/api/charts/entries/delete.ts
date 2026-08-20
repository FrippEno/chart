import type { APIRoute } from 'astro';
import { getDB } from '../../../../lib/db/client';
import { deleteEntry } from '../../../../lib/db/chart-queries';

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
    await deleteEntry(db, data.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete entry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
