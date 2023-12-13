"use client";

import Link from "next/link";

export function ProjectNav({ id }: { id: string }) {
  const links = [
    { href: `/projects/${id}`, label: "Images" },
    { href: `/projects/${id}/import`, label: "Import" },
    { href: `/projects/${id}/label`, label: "Label" },
    { href: `/projects/${id}/review`, label: "Review" },
    { href: `/projects/${id}/settings`, label: "Settings" },
  ];
  return (
    <div className="flex gap-8">
      {links.map(({ href, label }) => (
        <Link key={href} href={href} passHref>
          {label}
        </Link>
      ))}
    </div>
  );
}
