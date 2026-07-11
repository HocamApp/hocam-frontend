/** Converts a supported YouTube URL (watch/embed/shorts/live, youtu.be) into a
 * safe youtube-nocookie.com embed URL, or null if the URL isn't a recognized
 * YouTube link. Never trust the input as raw embed code — only a validated
 * video ID is used to build the returned URL. */
export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else {
        const parts = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0] || "")) {
          videoId = parts[1] || "";
        }
      }
    }

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}
