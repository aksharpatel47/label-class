"use client";

import { importInference } from "@/app/lib/actions/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { H2 } from "@/components/ui/typography";
import { TrainedModels } from "@/db/schema";
import { useFormState } from "react-dom";

interface ILabelImportFormProps {
  projectId: string;
  trainedModels: TrainedModels[];
}
export function ImportInferenceForm(props: ILabelImportFormProps) {
  const importInferenceForProject = importInference.bind(null, props.projectId);
  const [state, dispatch] = useFormState(importInferenceForProject, undefined);
  return (
    <form action={dispatch} className="flex flex-col gap-4 w-[300px]">
      <H2>Import Inferences</H2>
      <Select name="trainedModel" required>
        <SelectTrigger>
          <SelectValue placeholder="Select Trained Model" />
        </SelectTrigger>
        <SelectContent>
          {props.trainedModels.map((trainedModel) => (
            <SelectItem
              key={trainedModel.id}
              value={trainedModel.id.toString()}
            >
              {trainedModel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="file" id="file" name="file" required />
      <Button type="submit">Import</Button>
      {state && <span id="fileMessage">{state}</span>}
    </form>
  );
}
