import { auth } from "@/lucia";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as context from "next/headers";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST = async (req: NextRequest) => {
  const result = loginSchema.safeParse(
    Object.fromEntries(await req.formData())
  );

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.message,
      },
      {
        status: 400,
      }
    );
  }

  const { email, password } = result.data;

  const key = await auth.useKey(
    "username",
    email.toLocaleLowerCase(),
    password
  );

  const user = await auth.getUser(key.userId);

  const session = await auth.createSession({
    userId: key.userId,
    attributes: {},
  });

  const authRequest = auth.handleRequest(req.method, context);
  authRequest.setSession(session);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/projects",
    },
  });
};
