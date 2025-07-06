// Keep it dead-simple: one handler, no nested Router()

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function forwardHandler(req, res) {
  const { name, email, message } = req.body;

  try {
    await resend.emails.send({
      from: 'Website <admin@athenalabo.com>',
      to:   'vareca@live.com',
      subject: `New query from ${name}`,
      html: `<p>${message}</p><p>Reply-to: ${email}</p>`
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
