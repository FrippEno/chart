// Read-only session recognition — verifies the auth_token cookie issued by
// starviewonline (shared via Domain=.starviewdata.com). This project never
// issues its own session; sign-in happens on starviewonline.

export interface AuthUser {
  id: number;
  email: string;
  google_id: string;
  name: string;
  avatar_url: string | null;
  is_admin: number;
  customer_id: number | null;
  created_at: string;
  last_login: string | null;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;

  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });

  return cookies;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await sign(signatureInput, secret);

  if (signature !== expectedSignature) return null;

  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export async function getAuthenticatedUser(request: Request, env: any): Promise<AuthUser | null> {
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const token = cookies.auth_token;
  if (!token) return null;

  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload) return null;

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(parseInt(payload.sub)).first<AuthUser>();

    return user ?? null;
  } catch {
    return null;
  }
}
