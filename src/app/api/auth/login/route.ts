import { auth } from "@/lucia";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as context from "next/headers";
import { LuciaError } from "lucia";
import { unstable_noStore } from "next/cache";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST = async (req: NextRequest) => {
  unstable_noStore();
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
    const key = await auth.useKey(
      "username",
      email.toLocaleLowerCase(),
      password
    );

    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
    });

    const authRequest = auth.handleRequest(req.method, context);
    authRequest.setSession(session);

    return NextResponse.json({
      message: "Success",
    });
  } catch (error) {
    if (error instanceof LuciaError) {
      if (
        error.message === "AUTH_INVALID_PASSWORD" ||
        error.message === "AUTH_INVALID_KEY_ID"
      ) {
        return NextResponse.json(
          {
            error: "Invalid username or password",
          },
          {
            status: 400,
          }
        );
      }
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        }
      );
    }

    console.error(error);

    return NextResponse.json({
      status: 500,
    });
  }
};
