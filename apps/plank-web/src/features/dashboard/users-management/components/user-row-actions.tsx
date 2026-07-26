import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@plank/ui/components/dropdown-menu";
import { TrashIcon, VenetianMaskIcon } from "lucide-react";
import type { ReactNode } from "react";

import { DeleteUserDialog } from "./delete-user-dialog";
import { ImpersonateUserDialog } from "./impersonate-user-dialog";

export type UserRowActionsProps = {
  userId: string;
  userName: string;
  /** When false, the delete action is omitted (e.g. current user). */
  canDelete?: boolean;
  /** When false, the impersonate action is omitted. */
  canImpersonate?: boolean;
  children: ReactNode;
};

export function UserRowActions({
  userId,
  userName,
  canDelete = true,
  canImpersonate = false,
  children,
}: UserRowActionsProps) {
  const hasActions = canDelete || canImpersonate;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasActions ? (
          <>
            {canImpersonate ? (
              <ImpersonateUserDialog userId={userId} userName={userName}>
                <DropdownMenuItem
                  onSelect={(event) => {
                    // Keep the menu from closing before the dialog can open.
                    event.preventDefault();
                  }}
                >
                  <VenetianMaskIcon />
                  Impersonate {userName}
                </DropdownMenuItem>
              </ImpersonateUserDialog>
            ) : null}
            {canDelete ? (
              <DeleteUserDialog userId={userId}>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    // Keep the menu from closing before the dialog can open.
                    event.preventDefault();
                  }}
                >
                  <TrashIcon />
                  Delete {userName}
                </DropdownMenuItem>
              </DeleteUserDialog>
            ) : null}
          </>
        ) : (
          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
