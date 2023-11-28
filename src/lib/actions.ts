"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { revalidatePath, unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const saltRounds = 10;

const FormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  password: z.string(),
});
export async function createUser(formdata: FormData) {
  const { firstName, lastName, email, password } = FormSchema.parse({
    firstName: formdata.get("firstName"),
    lastName: formdata.get("lastName"),
    email: formdata.get("email"),
    password: formdata.get("password"),
  });
  const hash = await bcrypt.hash(password, saltRounds);
  await db.insert(users).values({
    firstName,
    lastName,
    email,
    passwordHash: hash,
  });
  revalidatePath("/users");
  redirect("/users");
}

export async function editUser(id: string, formdata: FormData) {
  const { firstName, lastName, email, password } = FormSchema.parse({
    firstName: formdata.get("firstName"),
    lastName: formdata.get("lastName"),
    email: formdata.get("email"),
    password: formdata.get("password"),
  });
  const hash = await bcrypt.hash(password, saltRounds);
  await db
    .update(users)
    .set({ firstName, lastName, email, passwordHash: hash })
    .where(eq(users.id, id));

  revalidatePath("/users");
  redirect("/users");
}
