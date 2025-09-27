import { useActionState } from "react";
"use client";

import { importData } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectLabel } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function ImageImportForm(props: {
  userId: string;
  projectId: string;
  projectLabels: ProjectLabel[];
}) {
  const importDataWithUser = importData.bind(
    null,
    props.projectId,
    props.userId,
  );
  const [state, dispatch] = useActionState(importDataWithUser, undefined);
  return (
    <form action={dispatch}>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Import Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageImportFormComponents
            state={state}
            projectLabels={props.projectLabels}
          />
        </CardContent>
      </Card>
    </form>
  );
}

function ImageImportFormComponents({
  state,
  projectLabels,
}: {
  state: string | undefined;
  projectLabels: ProjectLabel[];
}) {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-col gap-4">
      <Input
        type="file"
        id="file"
        name="file"
        required
        aria-describedby="fileMessage"
        disabled={pending}
      />
      <Label htmlFor="label">Project Label</Label>
      <Select name="label" defaultValue={"None"} required disabled={pending}>
        <SelectTrigger>
          <SelectValue placeholder="Select Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={"None"}>None</SelectItem>
          {projectLabels.map((label) => (
            <SelectItem key={label.id} value={label.id}>
              {label.labelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" disabled={pending}>
        Upload
        {pending && "ing..."}
      </Button>
    </div>
  );
}
