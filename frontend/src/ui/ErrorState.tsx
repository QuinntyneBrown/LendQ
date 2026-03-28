import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  name: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ name, message, onRetry }: ErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div data-testid={`error-${name}`}>
        <AlertCircle
          size={48}
          className="text-danger-text mx-auto mb-4"
          aria-hidden="true"
        />
        <p className="text-text-primary font-body text-sm mb-6">{message}</p>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
