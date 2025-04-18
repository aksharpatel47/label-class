"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import React from "react";

type State = {
  name: string;
  email: string;
  password: string;
  error?: string;
  loading: boolean;
};

type Actions = {
  setName(name: string): void;
  setEmail(email: string): void;
  setPassword(password: string): void;
  setError(error?: string): void;
  setLoading(loading: boolean): void;
};

const useSignupFormState = create<State & Actions>()(
  immer((set) => ({
    name: "",
    email: "",
    password: "",
    loading: false,
    setName: (name) => {
      set((state) => {
        state.name = name;
      });
    },
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
  })),
);

export function SignupForm() {
  const {
    name,
    email,
    password,
    error,
    loading,
    setName,
    setEmail,
    setPassword,
    setError,
    setLoading,
  } = useSignupFormState();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (resp.status === 200) {
        router.replace("/projects");
      } else {
        const { error } = await resp.json();
        setError(error);
      }
    } catch (error) {
      setError("Unknown error occurred.");
    }

    setLoading(false);
  }
  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="name">Name</Label>
          <Input
            type="text"
            name="name"
            placeholder="Enter your name"
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Label htmlFor="email">Email</Label>
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Minimum 6 characters"
            disabled={loading}
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit">Create User</Button>
          {!!error ? <div className="text-red-500">{error}</div> : null}
        </CardFooter>
      </Card>
    </form>
  );
}
