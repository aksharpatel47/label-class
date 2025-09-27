"use client";

import { ValidateRequestResult } from "@/lib/auth/auth";
import { createContext } from "react";

export const SessionContext = createContext<ValidateRequestResult | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: ValidateRequestResult;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
