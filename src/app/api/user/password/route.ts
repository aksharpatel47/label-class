import { updatePassword, validateRequest } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(6),
});

export const PATCH = async (req: NextRequest) => {
  const session = await validateRequest();

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
    await updatePassword(session.user.id, password);

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
