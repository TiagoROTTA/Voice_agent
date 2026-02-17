import { NextResponse } from "next/server";

/**
 * Récupère une URL signée ElevenLabs pour le convai avec un timeout d'inactivité
 * prolongé (180 s au lieu de ~10–20 s par défaut), pour éviter les coupures en milieu d'appel.
 */
export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY or NEXT_PUBLIC_ELEVENLABS_AGENT_ID" },
      { status: 500 }
    );
  }

  const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
  const res = await fetch(url, {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[convai-signed-url] ElevenLabs error:", res.status, text.slice(0, 200));
    return NextResponse.json(
      { error: "Failed to get signed URL from ElevenLabs" },
      { status: 502 }
    );
  }

  const body = (await res.json()) as { signed_url?: string };
  let signedUrl = body.signed_url ?? "";

  if (!signedUrl.startsWith("wss://") && !signedUrl.startsWith("ws://")) {
    return NextResponse.json({ error: "Invalid signed URL format" }, { status: 502 });
  }

  // Prolonger le timeout d'inactivité (max 180 s) pour éviter la coupure ~10–20 s
  signedUrl += signedUrl.includes("?") ? "&" : "?";
  signedUrl += "inactivity_timeout=180";

  return NextResponse.json({ signedUrl });
}
