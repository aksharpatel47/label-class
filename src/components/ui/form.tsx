import { createUser } from "@/lib/actions";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Label } from "./label";
import { Input } from "./input";

export function FormUI(props: IformUIComponent) {
  return (
    <form
      className="text-left border border-solid w-[350px] ml-auto mr-auto"
      action={props.action}
    >
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="firstName" className="block mt-2"></Label>
              FirstName:{" "}
              <Input
                type="text"
                name="firstName"
                id="firstName"
                className="border border-solid rounded-sm"
                placeholder="Enter your firstName"
                defaultValue={props.user.firstName}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="lastName" className="block mt-2"></Label>
              LastName:{" "}
              <Input
                type="text"
                name="lastName"
                id="lastName"
                className="border border-solid rounded-sm"
                placeholder="Enter your lastName"
                defaultValue={props.user.lastName}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email" className="block mt-2"></Label>
              Email:{" "}
              <Input
                type="email"
                name="email"
                id="email"
                className="border border-solid rounded-sm"
                placeholder="Enter your email"
                defaultValue={props.user.email}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password" className="block mt-2"></Label>
              Password:{" "}
              <Input
                type="password"
                name="password"
                id="email"
                className="border border-solid rounded-sm"
                placeholder="Enter your password"
                defaultValue={props.user.password}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex">
          <Button type="submit" className="ml-auto mr-auto">
            Submit
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

interface IformUIComponent {
  action: any;
  title: string;
  user?:any;
}
