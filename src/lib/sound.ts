/**
 * Short, soft "message sent" cue generated with the Web Audio API — no asset,
 * no dependency. Must only be called as a direct result of a user action
 * (e.g. a successful send) so browsers allow audio playback.
 */
export function playSendSound(): void {
  if (typeof window === "undefined") return;

  // Respect users who prefer reduced motion / minimal UI feedback.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    // Soft, quick fade so it is subtle and not annoying.
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    // Audio is best-effort; never let it break sending.
  }
}
