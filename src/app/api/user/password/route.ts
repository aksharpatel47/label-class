import { getRouteSession } from "@/app/lib/utils/session";
import { auth } from "@/lucia";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(6),
});

export const PATCH = async (req: NextRequest) => {
  unstable_noStore();
  const session = await getRouteSession(req.method);

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const result = passwordSchema.safeParse(await req.json());

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

  const { password } = result.data;

  try {
    const keys = await auth.getAllUserKeys(session.user.userId);
    const key = keys[0];
    await auth.updateKeyPassword(key.providerId, key.providerUserId, password);
    return NextResponse.json({
      message: "Success",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Unexpected error",
      },
      {
        status: 500,
      }
    );
  }
};
