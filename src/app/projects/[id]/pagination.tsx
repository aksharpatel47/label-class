"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div>
      <Button disabled={currentPage === 1}>
        <Link href={createPageURL(currentPage - 1)}>Back</Link>
      </Button>
      <Button disabled={currentPage === totalPages}>
        <Link href={createPageURL(currentPage + 1)}>Next</Link>
      </Button>
    </div>
  );
}
