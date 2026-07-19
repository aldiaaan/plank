import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@plank/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@plank/ui/components/empty";
import { cn } from "@plank/ui/utils";

export type QueryErrorProps = {
  className?: string;
  title?: string;
  description?: ReactNode;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
};

function getErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string" && error.length > 0) return error;
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message.length > 0
  ) {
    return (error as { message: string }).message;
  }
  return undefined;
}

/**
 * Empty-state layout for failed remote fetches (tables, panels, etc.).
 * Built on the shadcn Empty primitives.
 */
export function QueryError(props: QueryErrorProps) {
  const {
    className,
    title = "Something went wrong",
    description,
    error,
    onRetry,
    retryLabel = "Try again",
  } = props;

  const resolvedDescription =
    description ??
    getErrorMessage(error) ??
    "We couldn’t load this data. Please try again.";

  return (
    <Empty className={cn("border-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-destructive">
          <AlertCircleIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{resolvedDescription}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onRetry}>
            <RefreshCwIcon data-icon="inline-start" />
            {retryLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
