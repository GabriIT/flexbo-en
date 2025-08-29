import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function forwardHandler(req, res) {
  try {
    const { name = 'Anonymous', email = 'no-reply@invalid', message = '' } = req.body || {};
    if (!message.trim()) return res.status(400).json({ ok: false, error: 'Empty message' });

    const result = await resend.emails.send({
      from: 'Website <noreply@flexbo-en.athenalabo.com>', // domain must be verified in Resend
      to: ['vareca@live.com', 'masami03ga@gmail.com', 'sophia@flexbo.com.cn'],  // can be a list
      subject: `New query from ${name}`,
      html: `<p>${message}</p><p>Reply-to: ${email}</p>`,
      reply_to: email,                                     // <-- real reply-to
    });

    res.json({ ok: true, id: result?.data?.id || null });
  } catch (err) {
    console.error('[RESEND ERROR]', err?.message || err);
    res.status(500).json({ ok: false, error: err?.message || 'send failed' });
  }
}
