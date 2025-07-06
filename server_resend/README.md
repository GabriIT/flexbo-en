# at the root of your project
npm i express cors dotenv resend
npm i -D nodemon concurrently

### On Dokku
dokku config:set flexbo-en RESEND_API_KEY=re_PvwxVv9C_DUyvNUseXk7nndAwRwHWzGdH

### Folders structure
my-project/
├─ server/
│  ├─ api/
│  │  └─ forward.js          ← Resend mailer route
│  └─ server.js              ← boots Express + serves React build
├─ src/                      ← your React code (unchanged)
├─ vite.config.ts
├─ package.json
└─ .env                      ← RESEND_API_KEY=...


Below is a minimal-impact way to bolt the Express mail-forwarding API onto the project you already have.

---

## 1 ️⃣ Keep your React app exactly as-is

Nothing in `src/` or the existing Vite build/output path changes.
We only:

| Where              | What we add                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| **root**           | `server/` folder (or any name you like) containing `server.js` and `api/forward.js` |
| **package.json**   | a few dependencies and an extra script                                              |
| **vite.config.ts** | a *dev-only* proxy so the React dev server can hit the API                          |

---

## 2 ️⃣ Folder layout

```txt
my-project/
├─ server/
│  ├─ api/
│  │  └─ forward.js          ← Resend mailer route
│  └─ server.js              ← boots Express + serves React build
├─ src/                      ← your React code (unchanged)
├─ vite.config.ts
├─ package.json
└─ .env                      ← RESEND_API_KEY=...
```

*(Call the folder `server`, `backend`, `server_resend`—whatever feels tidy.)*

---

## 3 ️⃣ Backend code

### `server/api/forward.js`

```js
import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/forward', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    await resend.emails.send({
      from: 'Website <noreply@your-domain.com>',
      to:   'vare@live.com',
      subject: `New query from ${name}`,
      html: `<p>${message}</p><p>Reply-to: ${email}</p>`
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
```

### `server/server.js`

```js
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import forward from './api/forward.js';

const app  = express();
const port = process.env.PORT || 3000;   // Dokku/Heroku will inject PORT

app.use(cors());
app.use(express.json());

// --- API -----------
app.use('/api', forward);

// --- Static React build -----------
const dist = path.join(path.resolve(), 'dist');   // vite build output
app.use(express.static(dist));
app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, () => console.log(`Server listening on ${port}`));
```

---

## 4 ️⃣ Dependencies & scripts

```bash
npm i express cors dotenv resend
npm i -D nodemon concurrently           # nice for local dev hot-reload
```

In `package.json`:

```jsonc
{
  "scripts": {
    "dev": "concurrently \"nodemon server/server.js\" \"vite\"",
    "build": "vite build",
    "start": "node server/server.js"
  }
}
```

* `npm run dev` → runs Vite on **:8080** and Express on **:3000**.
* `npm run build && npm start` → production mode: Express serves the pre-built React files and the API on the **same** port (Dokku sets `$PORT`).

---

## 5 ️⃣ Update `vite.config.ts` (add proxy only)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    // 👇 NEW: dev requests beginning with /api go to Express
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
}));
```

*Production builds are unaffected—the proxy block is ignored because Vite isn’t even running in prod.*

---

## 6 ️⃣ Environment variable

Create `.env` (never commit it):

```
RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

On Dokku later:

```bash
dokku config:set myapp RESEND_API_KEY=re_XXXXXXXXXXXXXXXX
```

---

## 7 ️⃣ Front-end fetch stays the same

Your `Contact.tsx` (or wherever) hits `/api/forward`—during dev, Vite proxies to `localhost:3000`; in production the browser is already on that same origin/port where Express lives.

```ts
await fetch('/api/forward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, message })
});
```

---

### Recap

1. **Add** `server/server.js` + `server/api/forward.js`.
2. **Install** `express cors dotenv resend`.
3. **Add** `"start": "node server/server.js"` so Dokku knows what to run.
4. **Proxy** `/api` in `vite.config.ts` for smooth local dev.

No existing React code or build behaviour is disturbed, and you now have a tiny mail-forwarding API living happily beside your front-end.
--------------------------------

Below is the **smallest possible edit** to your `Contact.tsx`: you only touch `handleSubmit` and (optionally) adjust the toast wording. Everything else—animations, layout, styling—stays exactly the same.

```diff
- const handleSubmit = (e: React.FormEvent) => {
-   e.preventDefault();
-   setIsSubmitting(true);
-   
-   // Simulate form submission
-   setTimeout(() => {
-     toast({
-       title: "Message Sent",
-       description: "Thank you for your message. We will get back to you shortly.",
-       duration: 5000,
-     });
-     setFormData({
-       name: '',
-       email: '',
-       phone: '',
-       company: '',
-       message: ''
-     });
-     setIsSubmitting(false);
-   }, 1500);
- };
+ const handleSubmit = async (e: React.FormEvent) => {
+   e.preventDefault();
+   setIsSubmitting(true);
+
+   // pick only the fields your Express route needs; you can send them all if you like
+   const payload = {
+     name:    formData.name,
+     email:   formData.email,
+     message: `
+       Phone   : ${formData.phone || '—'}
+       Company : ${formData.company || '—'}
+
+       ${formData.message}
+     `,
+   };
+
+   try {
+     const res = await fetch('/api/forward', {
+       method: 'POST',
+       headers: { 'Content-Type': 'application/json' },
+       body: JSON.stringify(payload),
+     });
+
+     if (!res.ok) throw new Error((await res.json()).error || 'Mail failed');
+
+     toast({
+       title: 'Message sent ✅',
+       description: 'Thank you for reaching out. We’ll reply as soon as possible.',
+       duration: 5000,
+     });
+
+     setFormData({
+       name: '',
+       email: '',
+       phone: '',
+       company: '',
+       message: '',
+     });
+   } catch (err: any) {
+     toast({
+       title: 'Whoops, something went wrong',
+       description: err.message ?? 'Please try again later.',
+       duration: 6000,
+       variant: 'destructive',
+     });
+   } finally {
+     setIsSubmitting(false);
+   }
+ };
```

### What changed?

| Change                                                              | Why                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `handleSubmit` is now `async` and calls **`fetch('/api/forward')`** | Sends the real request instead of the fake timeout.                                      |
| `payload`                                                           | Builds the JSON exactly the way your Express route (`server/api/forward.js`) expects it. |
| `try / catch / finally`                                             | Graceful UI feedback for success **and** failure, always re-enables the button.          |
| `toast` messages                                                    | Re-used your existing toast hook so the UX stays consistent.                             |

> **Important:** the `/api` prefix works in dev because of the proxy block you added to `vite.config.ts`, and in production because Express serves both the API route and the React build on the same origin and port.

Once you deploy with `dokku config:set RESEND_API_KEY=…` and push, every form submission will land in **[vare@live.com](mailto:vare@live.com)** via Resend—no more simulated delays needed.
--------

### Test Resend local

### Local end-to-end test checklist (Track A stack)

| Step                              | Command / Action                                                               | What you should see                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **1. Add an env file**            | `echo "RESEND_API_KEY=re_test_your_key_here" > .env`                           | The Express route can read the key via `dotenv`                                                                                |
| **2. Install dev helpers (once)** | `npm i -D nodemon concurrently`                                                | Lets you hot-reload the API while Vite runs                                                                                    |
| **3. Start both servers**         | `npm run dev`  <br>(script from previous message)                              | - Vite → **[http://localhost:8080](http://localhost:8080)** <br>- Express → **[http://localhost:3000](http://localhost:3000)** |
| **4. Open the form**              | Browser → `http://localhost:8080/contact`                                      | Page renders; no CORS errors                                                                                                   |
| **5. Submit**                     | Fill the fields → **Send**                                                     | In DevTools ▸ Network: `POST /api/forward 200 OK`                                                                              |
| **6. Verify e-mail**              | Check **[vare@live.com](mailto:vare@live.com)** (or whatever address you used) | Message arrives almost instantly                                                                                               |

---

#### If you *don’t* want to send real mail while coding

1. **Create a toggle** in `server/api/forward.js` right before calling Resend:

   ```js
   if (process.env.SKIP_EMAILS === 'true') {
     console.log('🔸 Dev mode – would send mail:\n', { name, email, message });
     return res.json({ ok: true, dev: true });
   }
   ```

2. **Run dev with that flag:**

   ```bash
   SKIP_EMAILS=true npm run dev
   ```

   You’ll see the payload printed in the terminal instead of hitting Resend’s API, yet your React app still gets a **200** and shows the success toast.

---

#### Curl / Postman sanity check (bypasses React)

```bash
curl -X POST http://localhost:3000/api/forward \
  -H "Content-Type: application/json" \
  -d '{"name":"Local Tester","email":"tester@example.com","message":"Hello from curl"}'
```

* Returns `{"ok":true}` ⇒ route is wired correctly.
* If you enabled `SKIP_EMAILS=true`, you’ll also see the JSON logged in the server console.

---

#### Troubleshooting quick hits

| Symptom                            | Fix                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **CORS error** in browser devtools | Make sure the proxy block exists in `vite.config.ts` and Vite is **really** running on 8080.                        |
| **404 /api/forward**               | Did you mount the route with `app.use('/api', forward)` and restart Nodemon?                                        |
| **Timeout / 502**                  | Check that `RESEND_API_KEY` is valid; in dev you can use the free key from your Resend dashboard.                   |
| **Mail goes to spam**              | Add the SPF/DKIM records Resend shows you for the `from:` domain (not needed for “onresend.com” sandbox addresses). |

Once that all works locally, push to Dokku:

```bash
git add .
git commit -m "feat: contact form email"
git push dokku main
dokku config:set <app> RESEND_API_KEY=re_live_key_here
```

…and the very same flow you just tested will work in production too.
