import { H1 } from "@/components/ui/typography";
import {
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { fetchUsers } from "@/lib/data/users";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default async function Page() {
  const users = await fetchUsers();
  return (
    <>
      <div>
        <H1>Users</H1>
      </div>
      <div className="flex mb-8">
        <Button>
          <Link href="/users/new">+ New User</Link>
        </Button>
      </div>
      <Table>
        <TableRow>
          <TableHead>FirstName</TableHead>
          <TableHead>LastName</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Button className="ml-10">
                  <Link href={`/users/${user.id}/edit`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
