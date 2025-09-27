import { logout } from "@/lib/auth/auth";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  await logout();

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
};
