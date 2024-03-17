"use client";

import { ProjectLabel } from "@/db/schema";
import { clearDataset } from "@/app/lib/actions/data";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IClearDatasetFormProps {
  projectId: string;
  projectLabels: ProjectLabel[];
}

export function ClearDatasetForm(props: IClearDatasetFormProps) {
  const clearDatasetForProject = clearDataset.bind(null, props.projectId);
  const [state, dispatch] = useFormState(clearDatasetForProject, undefined);

  return (
    <form action={dispatch} className="flex flex-col gap-4 w-[350px]">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Clear Dataset</CardTitle>
        </CardHeader>
        <CardContent>
          <ClearDatasetFormComponents
            state={state}
            projectLabels={props.projectLabels}
          />
        </CardContent>
      </Card>
    </form>
  );
}

export function ClearDatasetFormComponents({
  state,
  projectLabels,
}: {
  state: string | undefined;
  projectLabels: ProjectLabel[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Select name="label" required disabled={state === "pending"}>
        <SelectTrigger>
          <SelectValue placeholder={"Select a label"} />
        </SelectTrigger>
        <SelectContent>
          {projectLabels.map((label) => (
            <SelectItem key={label.id} value={label.id}>
              {label.labelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="submit"
        disabled={state === "pending"}
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        Clear Dataset
      </Button>
    </div>
  );
}
