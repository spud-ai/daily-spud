export const prerender = false;

import { Resend } from 'resend';

const AUDIENCE_ID = 'b31476cf-95de-437d-bce5-9b9f3c7e7705';

export const GET = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email || !email.includes('@')) {
    return new Response(unsubPage('Invalid email address.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.contacts.remove({
      audienceId: AUDIENCE_ID,
      email,
    });
  } catch (e) {
    // Contact may not exist — that's fine, they're still unsubscribed
    console.log(`Unsubscribe: ${email} — ${(e as Error).message}`);
  }

  return new Response(unsubPage(`${email} has been unsubscribed.`, true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
};

function unsubPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — The Daily Spud</title>
  <style>
    body { margin:0; padding:40px 20px; font-family:Georgia,serif; background:#FDF6E3; color:#1A1207; text-align:center; }
    .card { max-width:480px; margin:80px auto; padding:40px; background:#fff; border:1px solid #1A1207; box-shadow:6px 6px 0px #1A1207; }
    h1 { font-size:28px; margin:0 0 16px; }
    p { font-size:16px; line-height:1.6; color:#4a3728; }
    a { color:#8B6914; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${success ? '👋' : '⚠️'} ${success ? 'Unsubscribed' : 'Error'}</h1>
    <p>${message}</p>
    ${success ? '<p style="margin-top:24px;font-size:14px;color:#8B6914;">Sorry to see you go! You can always resubscribe at <a href="https://dailyspud.colegottdank.com">dailyspud.colegottdank.com</a>.</p>' : ''}
  </div>
</body>
</html>`;
}
