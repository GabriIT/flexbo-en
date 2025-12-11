// src/lib/api.ts
function baseUrl() {
  const raw = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  const url = raw.replace(/\/+$/, ""); // strip trailing slash
  console.log('[API] baseUrl raw:', raw, '-> processed:', url);
  return url;
}

export async function sendChat(message: string, threadId?: number) {
  const baseUrlValue = baseUrl();
  const url = `${baseUrlValue}/api/chat`;
  console.log('[API] Sending chat to:', url);
  console.log('[API] Message:', message, 'ThreadId:', threadId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": import.meta.env.VITE_API_KEY || "secret",
    },
    body: JSON.stringify({ message, thread_id: threadId ?? null }),
  });

  console.log('[API] Response status:', res.status);
  const text = await res.text();
  console.log('[API] Response text:', text);

  if (!res.ok) throw new Error(`Backend error ${res.status}: ${text}`);
  const parsed = JSON.parse(text) as { thread_id: number; response: string };
  console.log('[API] Parsed response:', parsed);
  return parsed;
}
