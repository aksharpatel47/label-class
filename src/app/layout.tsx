import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Label Class",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col ml-64 mr-64 mt-16">
          <div className="flex gap-4 mb-8 items-center justify-between">
            <div className="flex gap-4 items-center">
              <Link href="/projects">Projects</Link>
              <Link href="/users">Users</Link>
              <Link href="/settings">Settings</Link>
            </div>
            <div className="flex items-center gap-8">
              User: {session?.user?.name}
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <Button type="submit">Sign Out</Button>
              </form>
            </div>
          </div>

          {children}
        </div>
      </body>
    </html>
  );
}
