import { auth } from "@/lucia";
import * as context from "next/headers";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const authRequest = auth.handleRequest(req.method, context);
  const session = await authRequest.validate();

  if (!session) {
    return new Response(null, {
      status: 401,
    });
  }

  await auth.invalidateSession(session.sessionId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
    },
  });
};
