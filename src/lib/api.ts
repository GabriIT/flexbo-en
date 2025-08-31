// src/lib/api.ts
function baseUrl() {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  return raw.replace(/\/+$/, ""); // strip trailing slash
}

export async function sendChat(message: string, threadId?: number) {
  const url = `${baseUrl()}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": import.meta.env.VITE_API_KEY || "secret",
    },
    body: JSON.stringify({ message, thread_id: threadId ?? null }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Backend error ${res.status}: ${text}`);
  return JSON.parse(text) as { thread_id: number; response: string };
}
