import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@plank/ui/components/dropdown-menu";
import { TrashIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DeleteUserDialog } from "./delete-user-dialog";

export type UserRowActionsProps = {
  userId: string;
  userName: string;
  /** When false, the delete action is omitted (e.g. current user). */
  canDelete?: boolean;
  children: ReactNode;
};

export function UserRowActions({
  userId,
  userName,
  canDelete = true,
  children,
}: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
        ) : (
          <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
