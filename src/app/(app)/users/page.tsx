import { H1 } from "@/components/ui/typography";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { fetchUsers } from "@/lib/data/users";
import Link from "next/link";

export default async function Page() {
  const users = await fetchUsers();
  return (
    <>
      <div className="flex justify-between mb-8">
        <H1>Users</H1>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <Link href={`/users/${user.id}`}>{user.name}</Link>
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/users/${user.id}`}>{user.id}</Link>
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/users/${user.id}`}>{user.role}</Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
