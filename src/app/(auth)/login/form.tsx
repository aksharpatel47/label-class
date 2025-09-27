import { useActionState } from "react";
"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import useSWR from "swr";
import { fetcher } from "@/app/lib/utils/fetcher";
import { useRouter } from "next/navigation";
import { set } from "zod";

type State = {
  email: string;
  password: string;
  error?: string;
  loading: boolean;
};

type Actions = {
  setEmail(email: string): void;
  setPassword(password: string): void;
  setError(error?: string): void;
  setLoading(loading: boolean): void;
};

const useLoginFormState = create<State & Actions>()(
  immer((set) => ({
    email: "",
    password: "",
    loading: false,
    setEmail: (email) => {
      set((state) => {
        state.email = email;
      });
    },
    setPassword: (password) => {
      set((state) => {
        state.password = password;
      });
    },
    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },
    setLoading: (loading) => {
      set((state) => {
        if (loading) {
          state.error = undefined;
        }
        state.loading = loading;
      });
    },
  }))
);

export function LoginForm() {
  const router = useRouter();
  const {
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    setError,
    setLoading,
  } = useLoginFormState();
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (resp.status === 200) {
        router.replace("/projects");
      } else {
        const { error } = await resp.json();
        setError(error);
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Email</Label>
                <Input
                  name="email"
                  id="email"
                  placeholder="Email of your account"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password of your account"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={loading}>
              Log In
            </Button>
            {!!error ? <div className="text-red-500">{error}</div> : null}
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
