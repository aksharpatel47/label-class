import clsx from "clsx";
import { PanelBottom } from "lucide-react";
import Link from "next/link";
import { basename } from "path/posix";

interface ICustomLinkProps {
  href: string;
  text: string;
  isActive: boolean;
}
export function CustomLink(props: ICustomLinkProps) {
  return (
    <Link
      href={props.href}
      className={clsx("hover:bg-slate-100 p-2 rounded-md", {
        "border-b-2 border-black": props.isActive,
      })}
    >
      {props.text}
    </Link>
  );
}
