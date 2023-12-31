"use client";

import { CustomLink } from "@/components/ui/link";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNav({ id }: { id: string }) {
  const pathName = usePathname();
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
        <CustomLink
          key={href}
          href={href}
          text={label}
          isActive={pathName === href}
        />
      ))}
    </div>
  );
}
