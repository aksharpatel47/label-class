"use client";

import { createUser } from "@/lib/actions";

export async function CreateUserForm() {
  return (
    <form className="text-center border border-solid" action={createUser}>
      <label htmlFor="firstName" className="block mt-2"></label>
      FirstName:{" "}
      <input
        type="text"
        name="firstName"
        id="firstName"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your firstName"
      />
      <label htmlFor="lastName" className="block mt-2"></label>
      LastName:{" "}
      <input
        type="text"
        name="lastName"
        id="lastName"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your lastName"
      />
      <label htmlFor="email" className="block mt-2"></label>
      Email:{" "}
      <input
        type="email"
        name="email"
        id="email"
        className="border border-solid rounded-sm bg-slate-200"
        placeholder="Enter your email"
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
