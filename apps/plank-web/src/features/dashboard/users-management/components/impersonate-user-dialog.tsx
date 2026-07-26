import { postAuthImpersonateMutation } from "@plank/client";
import { Button } from "@plank/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@plank/ui/components/dialog";
import { toast } from "@plank/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode,useState } from "react";
import { useRevalidator } from "react-router";

export type ImpersonateUserDialogProps = {
  userId: string;
  userName: string;
  children: ReactNode;
};

export function ImpersonateUserDialog({
  userId,
  userName,
  children,
}: ImpersonateUserDialogProps) {
  const queryClient = useQueryClient();
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);

  const {
    mutateAsync: impersonate,
    isPending,
    error,
    reset,
  } = useMutation({
    ...postAuthImpersonateMutation(),
  });

  async function handleConfirm() {
    await impersonate({
      body: { userId },
      credentials: "include",
    });

    queryClient.clear();
    toast.success(`Now impersonating ${userName}`);
    setOpen(false);
    void revalidator.revalidate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Impersonate user</DialogTitle>
          <DialogDescription>
            Act as {userName}? You will see the app with their permissions. Use
            the top bar to stop impersonating when you are done.
          </DialogDescription>
        </DialogHeader>

        {error?.message ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {isPending ? "Starting…" : "Impersonate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
