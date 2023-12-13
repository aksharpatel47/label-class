"use client";

import { createProject } from "@/app/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H2 } from "@/components/ui/typography";

export function NewProjectForm({ userId }: { userId: string }) {
  const createProjectByUserId = createProject.bind(null, userId);

  return (
    <div className="flex justify-center">
      <form action={createProjectByUserId} className="w-[600px]">
        <H2>Form to Create New Project</H2>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Project Name</Label>
            <Input
              name="name"
              id="name"
              placeholder="Name of your project..."
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="labels">Labels</Label>
            <Input
              id="labels"
              name="labels"
              placeholder="Labels of your project in comma separated format..."
            />
          </div>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </div>
  );
}
