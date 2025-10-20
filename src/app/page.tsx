import Link from "next/link";

export default async function Home() {
  // Middleware handles authentication redirects
  return (
    <div>
      <Link href="/login">Login</Link>
      <Link href="/signup">Signup</Link>
    </div>
  );
}
