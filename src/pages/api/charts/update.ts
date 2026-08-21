import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db/client';
import { updateChart } from '../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    if (!data.id) {
      return new Response(JSON.stringify({ error: 'Chart ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB(locals.runtime?.env);
    await updateChart(db, data.id, {
      title: data.title,
      x_axis_label: data.x_axis_label,
      y_axis_label: data.y_axis_label,
      y_min: data.y_min !== undefined ? Number(data.y_min) : undefined,
      y_max: data.y_max !== undefined ? Number(data.y_max) : undefined,
      date_start: data.date_start,
      date_end: data.date_end,
      goal_score: data.goal_score !== undefined ? (data.goal_score === '' ? null : Number(data.goal_score)) : undefined,
      goal_date: data.goal_date !== undefined ? (data.goal_date || null) : undefined,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update chart error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update chart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
