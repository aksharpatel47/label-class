"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { CustomLink } from "../../components/ui/link";

const links = [
  {
    name: "Projects",
    href: "/projects",
  },
  {
    name: "Users",
    href: "/users",
  },
  {
    name: "Settings",
    href: "/settings",
  },
];
export default function NavLinks() {
  const pathName = usePathname();
  return (
    <>
      {links.map((link) => {
        return (
          <CustomLink
            key={link.name}
            href={link.href}
            isActive={pathName.startsWith(link.href)}
            text={link.name}
          ></CustomLink>
        );
      })}
    </>
  );
}
