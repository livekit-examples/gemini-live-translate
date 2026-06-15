import type { RemoteTrackPublication } from "livekit-client";

// Translator-track name format set by the Python agent in
// translator/src/session.py: f"tx:{speaker_identity}:{target_lang}"
export const TRANSLATION_TRACK_PREFIX = "tx:";

export function parseTranslationTrackName(
  name: string,
): { sourceIdentity: string; targetLang: string } | null {
  if (!name.startsWith(TRANSLATION_TRACK_PREFIX)) return null;
  const parts = name.slice(TRANSLATION_TRACK_PREFIX.length).split(":");
  if (parts.length < 2) return null;
  // Identity can theoretically contain ":"; treat the last segment as the
  // target language and join the rest back.
  const targetLang = parts.pop()!;
  const sourceIdentity = parts.join(":");
  if (!sourceIdentity || !targetLang) return null;
  return { sourceIdentity, targetLang };
}

export function getTranslationTrackSubscription(
  trackName: string,
  myLang: string,
  peerLangs: Map<string, string | undefined>,
  nativeLang: string,
  myIdentity?: string,
): boolean | null {
  const parsed = parseTranslationTrackName(trackName);
  if (!parsed) return null;

  if (parsed.sourceIdentity === myIdentity) return false;

  if (myLang === nativeLang) return false;

  const matchesMe = parsed.targetLang === myLang;
  const speakerLang = peerLangs.get(parsed.sourceIdentity);
  const speakerNotMyLang = speakerLang !== myLang;

  return matchesMe && speakerNotMyLang;
}

export function needsSubscriptionUpdate(
  pub: Pick<RemoteTrackPublication, "isSubscribed" | "isDesired">,
  desired: boolean,
) {
  return pub.isSubscribed !== desired || pub.isDesired !== desired;
}

export function applyDesiredSubscription(
  pub: RemoteTrackPublication,
  desired: boolean,
) {
  if (needsSubscriptionUpdate(pub, desired)) {
    pub.setSubscribed(desired);
  }
}
