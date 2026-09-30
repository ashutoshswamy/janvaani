import { caller, rateLimit } from "@/lib/firebase-admin";

const MODEL = "gemini-3.5-transcribe";
const MAX_AUDIO = 15 * 1024 * 1024; // Gemini inline data caps the whole request at 20 MB

/** Voice → text in the speaker's own language and script. */
export async function POST(req: Request) {
  const me = await caller(req);
  if (!me) return Response.json({ error: "Sign in required" }, { status: 401 });
  const limited = await rateLimit("transcribe", me.uid, 30, 3600);
  if (limited) return limited;

  const audio = (await req.formData().catch(() => null))?.get("audio");
  if (!(audio instanceof File) || !audio.type.startsWith("audio/") || !audio.size || audio.size > MAX_AUDIO)
    return Response.json({ error: "Audio must be under 15 MB" }, { status: 400 });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: "Transcribe this audio verbatim in the language spoken, using that language's native script. Do not translate. Output only the transcript." },
          { inlineData: { mimeType: audio.type.split(";")[0], data: Buffer.from(await audio.arrayBuffer()).toString("base64") } },
        ],
      }],
    }),
  });
  if (!res.ok) {
    console.error("Gemini transcribe error", res.status, await res.text());
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
  // gemini-3.5-transcribe answers with an audioTranscription part, not a text part.
  const part = (await res.json()).candidates?.[0]?.content?.parts?.[0];
  const text = (part?.audioTranscription?.text ?? part?.text ?? "").trim();
  return Response.json({ text });
}
