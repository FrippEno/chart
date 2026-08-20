import { defineMiddleware } from 'astro:middleware';
import { getAuthenticatedUser } from './lib/auth';

const SIGN_IN_URL = 'https://www.starviewdata.com/api/auth/google';

const SIGN_IN_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign in required</title>
    <style>
        body { font-family: system-ui, sans-serif; background: #f5f8f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .box { text-align: center; background: #fff; border: 1px solid #d8e2d8; border-radius: 8px; padding: 2.5rem; max-width: 360px; }
        h1 { color: #1e4620; font-size: 1.25rem; margin-bottom: 0.5rem; }
        p { color: #555; font-size: 0.9rem; margin-bottom: 1.5rem; }
        a { display: inline-block; background: #b8860b; color: #fff; text-decoration: none; font-weight: 600; padding: 0.65rem 1.4rem; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Sign in required</h1>
        <p>Sign in on starviewonline, then come back to this page.</p>
        <a href="${SIGN_IN_URL}">Sign in with Google</a>
    </div>
</body>
</html>`;

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals, url } = context;
  const env = locals.runtime?.env;
  const user = await getAuthenticatedUser(request, env);

  if (!user || user.is_admin !== 1) {
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(SIGN_IN_PAGE, {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return next();
});
