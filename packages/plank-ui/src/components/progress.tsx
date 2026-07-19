import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@plank/ui/utils";

function Progress({
  className,
  value,
  indeterminate = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indeterminate?: boolean;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={indeterminate ? null : value}
      data-indeterminate={indeterminate || undefined}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full bg-primary transition-all",
          indeterminate
            ? "w-1/3 animate-[progress-indeterminate_1.4s_ease-in-out_infinite]"
            : "w-full flex-1",
        )}
        style={
          indeterminate
            ? undefined
            : { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
