"use client";

import { ValidateRequestResult } from "@/lib/auth/auth";
import { createContext, useContext } from "react";

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

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return session;
}
