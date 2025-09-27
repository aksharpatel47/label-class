import { updatePassword, validateRequest } from "@/lib/auth/auth";
import { unstable_noStore } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as context from "next/headers";

const passwordSchema = z.object({
  password: z.string().min(6),
});

export const PATCH = async (req: NextRequest) => {
  unstable_noStore();
  const result = await validateRequest();

  if (!result) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const parsedResult = passwordSchema.safeParse(await req.json());

  if (!parsedResult.success) {
    return NextResponse.json(
      {
        error: parsedResult.error.message,
      },
      {
        status: 400,
      }
    );
  }

  const { password } = parsedResult.data;

  try {
    await updatePassword(result.user.id, password);

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
