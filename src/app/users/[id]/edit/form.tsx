"use client";

import { FormUI } from "@/components/ui/form";
import { users } from "@/db/schema";
import { editUser } from "@/lib/actions";

export async function EditUserForm(props: {
  id: string;
  user: typeof users.$inferSelect;
}) {
  const user = props.user;
  const editUserWithId = editUser.bind(null, props.id);
  return <FormUI action={editUserWithId} title="Edit User" user={user} />;
}
