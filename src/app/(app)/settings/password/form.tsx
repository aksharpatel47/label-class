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
import { STATUS_CODES } from "http";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type State = {
  newPassword: string;
  confirmNewPassword: string;
  loading: boolean;
  error?: string;
  message?: string;
};

type Actions = {
  setNewPassword(newPassword: string): void;
  setConfirmNewPassword(confirmNewPassword: string): void;
  setLoading(loading: boolean): void;
  setError(error?: string): void;
  setMessage(message?: string): void;
};

const useChangePasswordFormState = create<State & Actions>()(
  immer((set) => ({
    newPassword: "",
    confirmNewPassword: "",
    loading: false,
    setNewPassword: (newPassword) => {
      set((state) => {
        state.newPassword = newPassword;
      });
    },
    setConfirmNewPassword: (confirmNewPassword) => {
      set((state) => {
        state.confirmNewPassword = confirmNewPassword;
      });
    },
    setLoading: (loading) => {
      set((state) => {
        if (loading) {
          state.error = undefined;
          state.message = undefined;
        }
        state.loading = loading;
      });
    },
    setError: (error) => {
      set((state) => {
        state.error = error;
      });
    },
    setMessage: (message) => {
      set((state) => {
        state.message = message;
      });
    },
  }))
);

export const ChangePasswordForm = () => {
  const {
    newPassword,
    confirmNewPassword,
    loading,
    error,
    message,
    setConfirmNewPassword,
    setNewPassword,
    setError,
    setLoading,
    setMessage,
  } = useChangePasswordFormState();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (resp.status === 200) {
        setMessage("Password changed successfully");
      } else {
        const { error } = await resp.json();
        setError(error);
      }
    } catch (e) {
      setError("Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            type="password"
            id="newPassword"
            name="newPassword"
            disabled={loading}
            value={newPassword}
            minLength={6}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
          <Input
            type="password"
            id="confirmNewPassword"
            name="confirmNewPassword"
            disabled={loading}
            value={confirmNewPassword}
            minLength={6}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button type="submit">Change Password</Button>
          {!!error ? <div className="text-red-500">{error}</div> : null}
          {!!message ? <div className="text-green-500">{message}</div> : null}
        </CardFooter>
      </Card>
    </form>
  );
};
