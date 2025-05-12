"use client";

import { Session } from "lucia";
import { createContext } from "react";

export const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
