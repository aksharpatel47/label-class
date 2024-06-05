"use client";

import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";

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
    <NavigationMenu>
      <NavigationMenuLink>
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
      </NavigationMenuLink>
    </NavigationMenu>
  );
}
