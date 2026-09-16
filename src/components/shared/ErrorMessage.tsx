import { InlineError } from "@/components/shared/InlineError";

interface ErrorMessageProps {
  message: string;
  title?: string;
}

/**
 * Kept as the shared entry point (about 70 files import it) but rendered as
 * the one inline error treatment instead of a boxed Alert, so a failure looks
 * the same wherever it appears. See InlineError.
 */
export function ErrorMessage({ message, title }: ErrorMessageProps) {
  return <InlineError message={message} title={title} />;
}
