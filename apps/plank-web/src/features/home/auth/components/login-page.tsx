import { postAuthLoginMutation } from "@plank/client";
import {
  LoginForm,
  type LoginFormValues,
} from "@plank/ui/components/login-form";
import { useMutation } from "@tanstack/react-query";
import { Pyramid } from "lucide-react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/login-page";

export const meta: Route.MetaFunction = () => [
  { title: "Login | Plank" },
  {
    name: "description",
    content: "Login to your Plank account.",
  },
];

export default function LoginPage() {
  const { mutateAsync: login, error } = useMutation({
    ...postAuthLoginMutation({}),
  });

  const navigate = useNavigate();

  async function handleLogin(values: LoginFormValues) {
    await login({
      body: {
        email: values.email,
        password: values.password,
      },
      credentials: "include",
    }).then(() => {
      navigate("/dashboard");
    });
  }

  return (
    <div className="grid min-h-svh">
      <div className="fixed inset-x-0 top-0 z-10 flex justify-center gap-2 p-6 md:justify-start md:p-10">
        <a
          href="#"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Pyramid className="size-4" />
          </div>
          Plank
        </a>
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center p-6 pt-16 md:p-10 md:pt-24">
        <div className="w-full max-w-xs">
          <LoginForm error={error?.message} onSubmit={handleLogin} />
        </div>
      </div>
      {/* <div className="relative hidden bg-muted lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div> */}
    </div>
  );
}
