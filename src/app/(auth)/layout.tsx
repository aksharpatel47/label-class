import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-center gap-8 m-8">
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
      </div>
      {children}
    </div>
  );
}
