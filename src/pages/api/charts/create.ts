import type { APIRoute } from 'astro';
import { getDB } from '../../../lib/db/client';
import { createChart } from '../../../lib/db/chart-queries';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const data = await request.json();

    const required = ['title', 'x_axis_label', 'y_axis_label', 'y_min', 'y_max', 'date_start', 'date_end'];
    for (const field of required) {
      if (data[field] === undefined || data[field] === '') {
        return new Response(JSON.stringify({ error: `${field} is required` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const db = getDB(locals.runtime?.env);
    const id = await createChart(db, {
      title: data.title,
      x_axis_label: data.x_axis_label,
      y_axis_label: data.y_axis_label,
      y_min: Number(data.y_min),
      y_max: Number(data.y_max),
      date_start: data.date_start,
      date_end: data.date_end,
    });

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create chart error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create chart' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
