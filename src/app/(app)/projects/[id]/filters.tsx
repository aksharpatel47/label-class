"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthUser } from "@/db/schema";
import { XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function UserDropdown({ users }: { users: AuthUser[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    searchParams.get("user") || undefined,
  );
  const router = useRouter();
  const createPageURL = (userId: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (userId === undefined) {
      params.delete("user");
    } else {
      params.set("user", userId);
    }
    return `${pathname}?${params.toString()}`;
  };

  console.log("currentUserId", currentUserId);

  const userOptions: { id: string; name: string }[] = [
    {
      id: "none",
      name: "None",
    },
    ...users,
  ];

  return (
    <div className="flex items-center mt-4">
      <Label className="mr-2">User</Label>
      <Select
        key={currentUserId}
        value={currentUserId}
        onValueChange={(value) => {
          setCurrentUserId(value);
          router.replace(createPageURL(value));
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        <SelectContent>
          {userOptions.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        onClick={() => {
          setCurrentUserId(undefined);
          router.replace(createPageURL(undefined));
        }}
      >
        <XCircle />
      </Button>
    </div>
  );
}
