import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirectIfAuthenticated } from "@/app/lib/utils/session";

export default async function Page() {
  await redirectIfAuthenticated();

  return (
    <div className="flex justify-center">
      <form action="/api/users" method="POST">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="name">Name</Label>
            <Input type="text" name="name" placeholder="Enter your name" />
            <Label htmlFor="email">Email</Label>
            <Input type="email" name="email" placeholder="Enter your email" />
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
            />
          </CardContent>
          <CardFooter>
            <Button type="submit">Create User</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
