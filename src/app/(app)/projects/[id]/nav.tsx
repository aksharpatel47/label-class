"use client";

import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

export function ProjectNav({ id }: { id: string }) {
  const pathName = usePathname();
  const links = [
    { href: `/projects/${id}`, label: "Images" },
    { href: `/projects/${id}/import`, label: "Import" },
    { href: `/projects/${id}/label`, label: "Label" },
    { href: `/projects/${id}/statistics`, label: "Statistics" },
    { href: `/projects/${id}/selection`, label: "Selection" },
    // { href: `/projects/${id}/settings`, label: "Settings" },
  ];
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {links.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <Link href={href} legacyBehavior passHref>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                active={pathName === href}
              >
                {label}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
