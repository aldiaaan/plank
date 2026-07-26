import { postRolesMutation } from "@plank/client";
import { PERMISSIONS, type Permission } from "@plank/common";
import { Button } from "@plank/ui/components/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@plank/ui/components/combobox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@plank/ui/components/field";
import { Input } from "@plank/ui/components/input";
import { Textarea } from "@plank/ui/components/textarea";
import { toast } from "@plank/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/create-role-page";

export const meta: Route.MetaFunction = () => [
  { title: "Create Role | Plank" },
  {
    name: "description",
    content: "Add a new role with permissions.",
  },
];

type CreateRoleFormValues = {
  name: string;
  description: string;
  permissions: Permission[];
};

export default function CreateRolePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissionsAnchor = useComboboxAnchor();

  const {
    mutateAsync: createRole,
    error,
    isPending,
  } = useMutation({
    ...postRolesMutation(),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleFormValues>({
    defaultValues: {
      name: "",
      description: "",
      permissions: [],
    },
  });

  const submitting = isSubmitting || isPending;

  async function onSubmit(values: CreateRoleFormValues) {
    await createRole({
      body: {
        name: values.name.trim(),
        description: values.description.trim() || null,
        permissions: values.permissions,
      },
      credentials: "include",
    });

    await queryClient.invalidateQueries({ queryKey: [{ _id: "getRoles" }] });
    toast.success("Role created");
    void navigate("/dashboard/roles");
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Create New Role
        </h1>
        <p className="text-sm text-muted-foreground">
          Define a role and the permissions it grants.
        </p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FieldGroup>
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              autoFocus
              placeholder="editor"
              aria-invalid={!!errors.name}
              {...register("name", {
                required: "Name is required",
                validate: (value) =>
                  value.trim().length > 0 || "Name is required",
              })}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.description || undefined}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Can edit content but not manage users."
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            <FieldError errors={[errors.description]} />
          </Field>

          <Field data-invalid={!!errors.permissions || undefined}>
            <FieldLabel htmlFor="permissions">Permissions</FieldLabel>
            <Controller
              control={control}
              name="permissions"
              rules={{
                validate: (value) =>
                  (value?.length ?? 0) > 0 || "Select at least one permission",
              }}
              render={({ field }) => (
                <Combobox
                  multiple
                  autoHighlight
                  items={[...PERMISSIONS]}
                  value={field.value}
                  onValueChange={(next) => {
                    field.onChange(next ?? []);
                  }}
                >
                  <ComboboxChips
                    ref={permissionsAnchor}
                    className="w-full"
                    aria-invalid={!!errors.permissions || undefined}
                  >
                    <ComboboxValue>
                      {(values: Permission[]) => (
                        <>
                          {values.map((item) => (
                            <ComboboxChip key={item}>{item}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput id="permissions" />
                        </>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={permissionsAnchor}>
                    <ComboboxEmpty>No permissions found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
            <FieldError errors={[errors.permissions]} />
          </Field>
        </FieldGroup>

        {error?.message ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link viewTransition to="/dashboard/roles">
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
