import { deleteUsersByIdMutation } from "@plank/client";
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
import { useState, type ReactNode } from "react";

export type DeleteUserDialogProps = {
  userId: string;
  children: ReactNode;
};

export function DeleteUserDialog({ userId, children }: DeleteUserDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const {
    mutateAsync: deleteUser,
    isPending: isDeleting,
    error,
    reset,
  } = useMutation({
    ...deleteUsersByIdMutation(),
  });

  async function handleConfirmDelete() {
    await deleteUser({
      path: { id: userId },
      credentials: "include",
    });

    await queryClient.invalidateQueries({ queryKey: [{ _id: "getUsers" }] });
    toast.success("User deleted");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isDeleting) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Delete user</DialogTitle>
          <DialogDescription>
            Delete this user? This removes their sessions and role assignments
            and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error?.message ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              void handleConfirmDelete();
            }}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
