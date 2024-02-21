"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

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
  const pathname = usePathname();
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map((link) => {
          return (
            <NavigationMenuItem key={link.name}>
              <Link href={link.href} legacyBehavior passHref>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  active={pathname.startsWith(link.href)}
                >
                  {link.name}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          );
        })}{" "}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
