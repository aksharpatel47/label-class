"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    name: "Projects",
    href: "/projects",
  },
  {
    name: "Models",
    href: "/models",
  },
  {
    name: "Assignments",
    href: "/assignments",
  },
  {
    name: "Datasets",
    href: "/datasets",
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
  const pathname = usePathname();
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => {
          return (
            <NavigationMenuItem key={link.name}>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                active={pathname.startsWith(link.href)}
                asChild
              >
                <Link href={link.href}>{link.name}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}{" "}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
