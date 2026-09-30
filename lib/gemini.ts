// Server-only. ponytail: raw REST instead of @google/genai, a few calls don't need an SDK.
const MODEL = "gemini-3.5-flash-lite";
export const str = { type: "STRING" };

/** One structured-output Gemini call. `schema` is a Gemini responseSchema (OBJECT). */
export async function gemini<T>(system: string, prompt: string, schema: object): Promise<T> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  return JSON.parse((await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
}
