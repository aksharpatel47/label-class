import { auth } from "@/lucia";
import { NextRequest, NextResponse } from "next/server";
import * as context from "next/headers";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST = async (req: NextRequest) => {
  const result = signupSchema.safeParse(
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

  const { name, email, password } = result.data;

  const user = await auth.createUser({
    key: {
      providerId: "username",
      providerUserId: email.toLowerCase(),
      password,
    },
    attributes: {
      name,
      role: "USER",
    },
  });

  const session = await auth.createSession({
    userId: user.userId,
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
