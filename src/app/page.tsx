import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/login">Login</Link>
      <Link href="/projects">Projects</Link>
      <Link href="/settings">Settings</Link>
    </div>
  );
}
