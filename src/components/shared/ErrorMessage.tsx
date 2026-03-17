import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  message: string;
  title?: string;
}

export function ErrorMessage({ message, title }: ErrorMessageProps) {
  return (
    <Alert variant="destructive">
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
