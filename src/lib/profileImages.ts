const DEMO_TUTOR_IMAGE_PATH = /^\/images\/tutors\/demo-(?:man|woman)-\d+\.jpg$/;

/**
 * Demo tutor photos are versioned frontend assets. Older seed runs stored the
 * full Vercel deployment URL in the database, so a retired deployment made
 * every demo avatar fail at once. Serve those known assets from the current
 * frontend origin instead. User-uploaded/Supabase URLs are left untouched.
 */
export function resolveProfileImageUrl(
  imageUrl: string | null | undefined
): string | undefined {
  const value = imageUrl?.trim();
  if (!value) return undefined;

  try {
    const parsed = new URL(value, "https://hocam.local");
    if (DEMO_TUTOR_IMAGE_PATH.test(parsed.pathname)) {
      return parsed.pathname;
    }
  } catch {
    // Keep malformed external values unchanged so AvatarFallback can handle
    // the image load failure in the same way it does today.
  }

  return value;
}
