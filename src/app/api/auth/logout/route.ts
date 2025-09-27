import { logout, validateRequest } from "@/lib/auth/auth";
import * as context from "next/headers";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  await logout(context);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
};
