import { CustomLink } from "@/components/ui/link";
import { H1 } from "@/components/ui/typography";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <H1>Settings</H1>
      <div className="flex mt-4 mb-4">
        <CustomLink
          href="/settings/password"
          text="Change Password"
          isActive={false}
        />
      </div>
      {children}
    </div>
  );
}
