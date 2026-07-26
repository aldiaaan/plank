import { postAuthStopImpersonateMutation } from "@plank/client";
import { Button } from "@plank/ui/components/button";
import { toast } from "@plank/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRevalidator } from "react-router";

export type ImpersonationBannerProps = {
  userName: string;
  userEmail: string;
};

export function ImpersonationBanner({
  userName,
  userEmail,
}: ImpersonationBannerProps) {
  const queryClient = useQueryClient();
  const revalidator = useRevalidator();

  const { mutateAsync: stopImpersonating, isPending } = useMutation({
    ...postAuthStopImpersonateMutation(),
  });

  async function handleStop() {
    await stopImpersonating({
      credentials: "include",
    });
    queryClient.clear();
    toast.success("Stopped impersonating");
    void revalidator.revalidate();
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-3 bg-amber-500 px-4 text-sm text-amber-950">
      <p className="min-w-0 truncate">
        You are impersonating{" "}
        <span className="font-semibold">{userName}</span>
        <span className="text-amber-950/80"> ({userEmail})</span>
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="shrink-0"
        disabled={isPending}
        onClick={() => {
          void handleStop();
        }}
      >
        {isPending ? "Stopping…" : "Stop impersonating"}
      </Button>
    </div>
  );
}
