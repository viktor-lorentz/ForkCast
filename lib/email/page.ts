/** Small branded HTML page for the confirm and unsubscribe links. */
export function notice(title: string, body: string): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · ForkCast</title></head>
<body style="margin:0;background:#faf7f2;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1c1917">
<div style="max-width:420px;margin:0 auto;padding:48px 20px;text-align:center">
<div style="font-size:24px;font-weight:700;color:#990000">${title}</div>
<p style="color:#57534e">${body}</p>
<a href="/" style="display:inline-block;margin-top:8px;background:#990000;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Open the app</a>
</div></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
