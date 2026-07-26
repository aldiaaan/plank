import { getRolesOptions, postUsersMutation } from "@plank/client";
import { Button } from "@plank/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@plank/ui/components/field";
import { Input } from "@plank/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@plank/ui/components/select";
import { toast } from "@plank/ui/components/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/create-user-page";

export const meta: Route.MetaFunction = () => [
  { title: "Create User | Plank" },
  {
    name: "description",
    content: "Add a new user to the system.",
  },
];

type CreateUserFormValues = {
  name: string;
  email: string;
  password: string;
  roleId: string;
};

function formatRoleLabel(name: string) {
  return name
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CreateUserPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rolesData, isLoading: isRolesLoading } = useQuery({
    ...getRolesOptions({
      query: { limit: 100, offset: 0 },
      credentials: "include",
    }),
  });

  const {
    mutateAsync: createUser,
    error,
    isPending,
  } = useMutation({
    ...postUsersMutation(),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const roles = rolesData?.result.items ?? [];
  const submitting = isSubmitting || isPending;

  async function onSubmit(values: CreateUserFormValues) {
    await createUser({
      body: {
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        roleId: values.roleId,
      },
      credentials: "include",
    });

    await queryClient.invalidateQueries({ queryKey: [{ _id: "getUsers" }] });
    toast.success("User created");
    void navigate("/dashboard/users");
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Create New User
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new user to the system.
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
              placeholder="Jane Doe"
              aria-invalid={!!errors.name}
              {...register("name", {
                required: "Name is required",
                validate: (value) =>
                  value.trim().length > 0 || "Name is required",
              })}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.email || undefined}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              aria-invalid={!!errors.email}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          <Field data-invalid={!!errors.password || undefined}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            <FieldError errors={[errors.password]} />
          </Field>

          <Field data-invalid={!!errors.roleId || undefined}>
            <FieldLabel htmlFor="roleId">Role</FieldLabel>
            <Controller
              control={control}
              name="roleId"
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isRolesLoading || roles.length === 0}
                >
                  <SelectTrigger
                    id="roleId"
                    className="w-full"
                    aria-invalid={!!errors.roleId}
                  >
                    <SelectValue
                      placeholder={
                        isRolesLoading
                          ? "Loading roles…"
                          : roles.length === 0
                            ? "No roles available"
                            : "Select a role"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {formatRoleLabel(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.roleId]} />
          </Field>
        </FieldGroup>

        {error?.message ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <div className="flex items-center gap-2 ml-auto">
          <Button type="button" variant="outline" asChild>
            <Link viewTransition to="/dashboard/users">
              Cancel
            </Link>
          </Button>
          <Button type="submit" disabled={submitting || isRolesLoading}>
            {submitting ? "Creating…" : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
}
