// Deepgram converts the substitute's voice handover recording into text.
// Docs: https://developers.deepgram.com/docs/pre-recorded-audio

export async function transcribeAudio(audioBuffer: ArrayBuffer, mimeType = "audio/webm"): Promise<string> {
  const res = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": mimeType
      },
      body: Buffer.from(audioBuffer)
    }
  );
  if (!res.ok) throw new Error(`Deepgram request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
}
