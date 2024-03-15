"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectLabel } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importDataset } from "@/app/lib/actions/data";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

interface IImportSelectionFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
}

export function ImportDatasetForm(props: IImportSelectionFormProps) {
  const importDatasetForProject = importDataset.bind(null, props.projectId);
  const [state, dispatch] = useFormState(importDatasetForProject, undefined);
  return (
    <form action={dispatch} className="flex flex-col gap-4 w-[350px]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Import Dataset</CardTitle>
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

export function ImageImportFormComponents({
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
      <Select name="label" required disabled={pending}>
        <SelectTrigger>
          <SelectValue placeholder="Select Label" />
        </SelectTrigger>
        <SelectContent>
          {projectLabels.map((label) => (
            <SelectItem key={label.id} value={label.id.toString()}>
              {label.labelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={pending}>
        Import
        {pending && "ing... "}
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {!pending && state === "Done" && (
          <span>
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
