"use client";

import { useFormState } from "react-dom";
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

export function LoginForm() {
  return (
    <>
      <form action="/api/auth/login" method="POST">
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
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password of your account"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex">
            <Button type="submit">Log In</Button>
          </CardFooter>
        </Card>
      </form>
    </>
  );
}
