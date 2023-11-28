"use client";

import { users } from "@/db/schema";
import { editUser } from "@/lib/actions";

export async function EditUserForm(params: {
  id: string;
  user: typeof users.$inferSelect;
}) {
  const user = params.user;
  const editUserWithId = editUser.bind(null, params.id);
  return (
    <form className="text-center border border-solid" action={editUserWithId}>
      <label htmlFor="firstName" className="block mt-2"></label>
      FirstName:{" "}
      <input
        type="text"
        name="firstName"
        id="firstName"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your firstName"
        defaultValue={user.firstName}
      />
      <label htmlFor="lastName" className="block mt-2"></label>
      LastName:{" "}
      <input
        type="text"
        name="lastName"
        id="lastName"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your lastName"
        defaultValue={user.lastName}
      />
      <label htmlFor="email" className="block mt-2"></label>
      Email:{" "}
      <input
        type="email"
        name="email"
        id="email"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your email"
        defaultValue={user.email ?? ""}
      />
      <label htmlFor="password" className="block mt-2"></label>
      Password:{" "}
      <input
        type="password"
        name="password"
        id="email"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your password"
      />
      <button
        type="submit"
        className="border border-solid block bg-green-400 mt-2 ml-auto mr-auto"
      >
        Submit
      </button>
    </form>
  );
}
