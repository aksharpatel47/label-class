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

export function ModelNav({ id }: { id: string }) {
  const pathName = usePathname();

  const links = [
    {
      href: `/models/${id}`,
      label: "Inferences",
    },
    {
      href: `/models/${id}/import`,
      label: "Import",
    },
  ];

  return (
    <NavigationMenu className="mt-4">
      <NavigationMenuList>
        {links.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              active={pathName === href}
              asChild
            >
              <Link href={href}>{label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
