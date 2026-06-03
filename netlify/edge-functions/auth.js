/* OFIZ Tasks — Netlify Edge Function password gate */

const SITE_PASSWORD = 'OFIZAccounting2026'; /* change this to your preferred password */

export default async (request, context) => {
  const url = new URL(request.url);

  /* Allow the login form POST through */
  const cookie = request.headers.get('cookie') || '';
  if (cookie.includes('ofiz_auth=ok')) return context.next();

  /* Handle password form submission */
  if (request.method === 'POST') {
    const body   = await request.text();
    const params = new URLSearchParams(body);
    if (params.get('password') === SITE_PASSWORD) {
      return new Response('', {
        status: 302,
        headers: {
          'Location':   '/',
          'Set-Cookie': 'ofiz_auth=ok; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400',
        },
      });
    }
    /* Wrong password — show form again with error */
    return new Response(_loginHtml(true), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  /* No cookie — show login form */
  return new Response(_loginHtml(false), {
    status: 401,
    headers: { 'Content-Type': 'text/html' },
  });
};

function _loginHtml(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OFIZ Tasks</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f3ef;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #fff;
      border: 1px solid #e8e5df;
      border-radius: 16px;
      padding: 44px 40px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 4px 40px rgba(15,14,12,0.08);
      text-align: center;
    }
    .logo {
      width: 44px; height: 44px;
      background: #0f0e0c;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: #faf9f7;
      font-family: Georgia, serif;
      margin: 0 auto 20px;
      letter-spacing: -0.5px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #0f0e0c; margin-bottom: 6px; letter-spacing: -0.3px; }
    p  { font-size: 13px; color: #6b6760; margin-bottom: 28px; }
    input {
      width: 100%;
      padding: 11px 14px;
      border: 1px solid #d8d4cc;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      margin-bottom: 12px;
      transition: border-color 160ms;
      background: #f5f3ef;
    }
    input:focus { border-color: #0d7a6b; background: #fff; }
    button {
      width: 100%;
      background: #0f0e0c;
      color: #faf9f7;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 160ms;
    }
    button:hover { background: #2a2825; }
    .error {
      color: #c0392b;
      font-size: 12px;
      margin-top: 10px;
      padding: 8px 12px;
      background: #fdf0ee;
      border-radius: 6px;
    }
    .footer { margin-top: 24px; font-size: 11px; color: #c8c4bc; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">OF</div>
    <h1>OFIZ Tasks</h1>
    <p>Internal use only — OFIZ Accounting</p>
    <form method="POST">
      <input type="password" name="password" placeholder="Enter site password" autofocus>
      <button type="submit">Enter</button>
      ${error ? '<div class="error">Incorrect password. Please try again.</div>' : ''}
    </form>
    <div class="footer">Authorised personnel only</div>
  </div>
</body>
</html>`;
}

export const config = { path: '/*' };
