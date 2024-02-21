import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Project } from "@/db/schema";

export function EditProjectForm(props: { project: Project }) {
  return (
    <form className="w-[600px]">
      <div className="flex flex-col gap-4">
        <Label htmlFor="name" className="flex flex-col gap-2">
          Name
          <Input
            type="text"
            name="name"
            required
            placeholder="Name of the project..."
          />
        </Label>
        <Label htmlFor="description" className="flex flex-col gap-2">
          Description
          <Input
            type="text"
            name="description"
            placeholder="Description for this project..."
          />
        </Label>

        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
