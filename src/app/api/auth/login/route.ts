import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as context from "next/headers";
import { getUserWithKey } from "@/lib/auth/db";
import { validateScryptHash } from "@/lib/auth/crypto";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { createSessionCookie } from "@/lib/auth/cookie";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST = async (req: NextRequest) => {
  const result = loginSchema.safeParse(await req.json());

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

  try {
    const user = await getUserWithKey(email);
    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        { status: 400 }
      );
    }
    const { userId, hashedPassword } = user;

    if (!hashedPassword) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        { status: 400 }
      );
    }

    const result = await validateScryptHash(password, hashedPassword);

    if (!result) {
      return NextResponse.json(
        {
          error: "Invalid username or password",
        },
        { status: 400 }
      );
    }

    const session = await createSession(userId);

    const sessionCookie = createSessionCookie(session);

    await setSessionCookie(sessionCookie, context);

    return NextResponse.json({
      message: "Success",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Server error",
        message: (error as Error).message,
      },
      {
        status: 500,
      }
    );
  }
};
